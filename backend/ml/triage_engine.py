import csv
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib
import pandas as pd

logger = logging.getLogger(__name__)

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "saved_models"
RESULTS_DIR = BASE_DIR / "results"
COMPARISON_CSV = RESULTS_DIR / "model_comparison.csv"

NUMERIC_COLS = [
    "hour_of_day",
    "usb_connected",
    "bytes_transferred",
    "failed_logins_24h",
    "deleted_after_activity",
]

CATEGORICAL_COLS = [
    "artifact_type",
    "action",
    "file_extension",
    "external_destination",
]

SCENARIO_FEATURES = NUMERIC_COLS + CATEGORICAL_COLS
TRIAGE_FEATURES = NUMERIC_COLS + CATEGORICAL_COLS + ["scenario"]

SUPPORTED_ALGORITHMS = [
    "xgboost",
    "random_forest",
    "logistic_regression",
    "tfidf_logistic_regression",
]


class MLTriageEngine:
    """
    Forensic Machine Learning Triage and Scenario Classification Engine.
    Loads trained models from saved_models/ and performs real-time inference on
    forensic events, cases, and telemetry.
    """

    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or MODEL_DIR
        self._artifacts_cache: Dict[str, Dict[str, Any]] = {}

    def is_model_available(self, task: str, algorithm: str) -> bool:
        path = self.model_dir / f"{task}__{algorithm}.joblib"
        return path.exists()

    def get_model_artifact(self, task: str, algorithm: str) -> Dict[str, Any]:
        cache_key = f"{task}__{algorithm}"
        if cache_key in self._artifacts_cache:
            return self._artifacts_cache[cache_key]

        model_path = self.model_dir / f"{task}__{algorithm}.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Model artifact not found: {model_path}")

        artifact = joblib.load(model_path)
        self._artifacts_cache[cache_key] = artifact
        return artifact

    def get_available_models(self) -> List[Dict[str, Any]]:
        models = []
        for task in ["scenario", "triage_label"]:
            for algo in SUPPORTED_ALGORITHMS:
                available = self.is_model_available(task, algo)
                models.append({
                    "task": task,
                    "algorithm": algo,
                    "available": available,
                    "file_path": str(self.model_dir / f"{task}__{algo}.joblib") if available else None,
                })
        return models

    def get_benchmarks(self) -> List[Dict[str, Any]]:
        """Reads results/model_comparison.csv and returns model metrics."""
        if not COMPARISON_CSV.exists():
            return []
        benchmarks = []
        try:
            with open(COMPARISON_CSV, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    benchmarks.append({
                        "task": row.get("task"),
                        "model": row.get("model"),
                        "train_accuracy": float(row.get("train_accuracy", 0.0)),
                        "test_accuracy": float(row.get("test_accuracy", 0.0)),
                        "train_macro_f1": float(row.get("train_macro_f1", 0.0)),
                        "test_macro_f1": float(row.get("test_macro_f1", 0.0)),
                        "test_macro_precision": float(row.get("test_macro_precision", 0.0)),
                        "test_macro_recall": float(row.get("test_macro_recall", 0.0)),
                    })
        except Exception as e:
            logger.warning(f"Failed to read model benchmarks: {e}")
        return benchmarks

    def normalize_event_features(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures all expected numerical and categorical features exist with valid defaults."""
        features = {
            "hour_of_day": int(raw.get("hour_of_day", 12)),
            "usb_connected": int(raw.get("usb_connected", 0)),
            "bytes_transferred": int(raw.get("bytes_transferred", 0)),
            "failed_logins_24h": int(raw.get("failed_logins_24h", 0)),
            "deleted_after_activity": int(raw.get("deleted_after_activity", 0)),
            "artifact_type": str(raw.get("artifact_type", "unknown")),
            "action": str(raw.get("action", "unknown")),
            "file_extension": str(raw.get("file_extension", "none")),
            "external_destination": str(raw.get("external_destination", "none")),
        }
        if "scenario" in raw and raw["scenario"]:
            features["scenario"] = str(raw["scenario"])
        return features

    def predict_scenario(
        self,
        event_data: Dict[str, Any],
        algorithm: str = "tfidf_logistic_regression",
    ) -> Dict[str, Any]:
        """
        Predicts forensic attack scenario (e.g. data_leakage, timeline_anomaly, suspicious_web_activity).
        """
        # Fallback to standard logistic regression if requested algo is missing
        if not self.is_model_available("scenario", algorithm):
            algorithm = "logistic_regression"

        artifact = self.get_model_artifact("scenario", algorithm)
        model = artifact["model"]
        label_encoder = artifact["label_encoder"]
        feature_cols = artifact["features"]

        normalized = self.normalize_event_features(event_data)
        X = pd.DataFrame([normalized]).reindex(columns=feature_cols)

        if algorithm == "tfidf_logistic_regression":
            model_input = X.fillna("unknown").astype(str).agg(" | ".join, axis=1)
        else:
            model_input = X

        encoded_pred = model.predict(model_input)[0]
        predicted_scenario = label_encoder.inverse_transform([encoded_pred])[0]

        probabilities: Dict[str, float] = {}
        confidence = 1.0

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(model_input)[0]
            # Determine classes
            classifier = model.named_steps.get("model") or model.named_steps.get("classifier") or model
            if hasattr(classifier, "classes_"):
                classes = list(classifier.classes_)
                for class_id, prob in zip(classes, probs):
                    label = label_encoder.inverse_transform([class_id])[0]
                    probabilities[label] = round(float(prob), 4)
                confidence = round(float(probabilities.get(predicted_scenario, max(probs))), 4)

        return {
            "predicted_scenario": predicted_scenario,
            "confidence": confidence,
            "probabilities": probabilities,
            "algorithm_used": algorithm,
        }

    def predict_triage_label(
        self,
        event_data: Dict[str, Any],
        algorithm: str = "xgboost",
    ) -> Dict[str, Any]:
        """
        Predicts triage priority (1 = High Risk / Flag for review, 0 = Low Risk).
        """
        if not self.is_model_available("triage_label", algorithm):
            # Fallback hierarchy: random_forest -> logistic_regression
            algorithm = "random_forest" if self.is_model_available("triage_label", "random_forest") else "logistic_regression"

        artifact = self.get_model_artifact("triage_label", algorithm)
        model = artifact["model"]
        label_encoder = artifact["label_encoder"]
        feature_cols = artifact["features"]

        normalized = self.normalize_event_features(event_data)

        # If scenario is missing, predict scenario first (Two-Stage Pipeline)
        if "scenario" not in normalized:
            scenario_res = self.predict_scenario(normalized)
            normalized["scenario"] = scenario_res["predicted_scenario"]

        X = pd.DataFrame([normalized]).reindex(columns=feature_cols)

        if algorithm == "tfidf_logistic_regression":
            model_input = X.fillna("unknown").astype(str).agg(" | ".join, axis=1)
        else:
            model_input = X

        encoded_pred = model.predict(model_input)[0]
        prediction_str = str(label_encoder.inverse_transform([encoded_pred])[0])
        flagged = (prediction_str == "1")

        prob_flagged = 0.5
        probabilities: Dict[str, float] = {}

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(model_input)[0]
            classifier = model.named_steps.get("model") or model.named_steps.get("classifier") or model
            if hasattr(classifier, "classes_"):
                classes = list(classifier.classes_)
                for class_id, prob in zip(classes, probs):
                    lbl = str(label_encoder.inverse_transform([class_id])[0])
                    probabilities[lbl] = round(float(prob), 4)

                try:
                    pos_class = label_encoder.transform(["1"])[0]
                    if pos_class in classes:
                        prob_flagged = float(probs[classes.index(pos_class)])
                except Exception:
                    prob_flagged = float(probabilities.get("1", 0.5))

        # Risk Tier calculation based on probability & indicators
        risk_score = round(prob_flagged * 100, 1)
        if risk_score >= 75:
            risk_tier = "CRITICAL"
        elif risk_score >= 50 or flagged:
            risk_tier = "HIGH"
        elif risk_score >= 25:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "LOW"

        # Key risk factors explanations
        risk_factors = []
        if normalized.get("hour_of_day", 12) < 6 or normalized.get("hour_of_day", 12) > 21:
            risk_factors.append(f"Off-hours activity ({normalized.get('hour_of_day')}h)")
        if normalized.get("bytes_transferred", 0) > 10_000_000:
            risk_factors.append(f"High outbound volume ({normalized.get('bytes_transferred') / (1024*1024):.1f} MB)")
        if normalized.get("usb_connected", 0) == 1:
            risk_factors.append("USB mass storage attached")
        if normalized.get("failed_logins_24h", 0) >= 3:
            risk_factors.append(f"{normalized.get('failed_logins_24h')} failed login attempts in last 24h")
        if normalized.get("deleted_after_activity", 0) == 1:
            risk_factors.append("Anti-forensics artifact deletion detected")

        return {
            "flagged": flagged,
            "prediction": prediction_str,
            "risk_score": risk_score,
            "risk_tier": risk_tier,
            "probability_flagged": round(prob_flagged, 4),
            "probabilities": probabilities,
            "scenario": normalized.get("scenario"),
            "risk_factors": risk_factors,
            "algorithm_used": algorithm,
        }

    def full_triage(
        self,
        event_data: Dict[str, Any],
        scenario_algo: str = "tfidf_logistic_regression",
        triage_algo: str = "xgboost",
    ) -> Dict[str, Any]:
        """
        Runs comprehensive two-stage ML triage:
        1. Attack scenario inference
        2. Triage severity and risk scoring
        """
        scenario_res = self.predict_scenario(event_data, algorithm=scenario_algo)
        event_with_scenario = dict(event_data)
        event_with_scenario["scenario"] = scenario_res["predicted_scenario"]

        triage_res = self.predict_triage_label(event_with_scenario, algorithm=triage_algo)

        return {
            "scenario": scenario_res["predicted_scenario"],
            "scenario_confidence": scenario_res["confidence"],
            "scenario_probabilities": scenario_res["probabilities"],
            "flagged": triage_res["flagged"],
            "risk_tier": triage_res["risk_tier"],
            "risk_score": triage_res["risk_score"],
            "probability_flagged": triage_res["probability_flagged"],
            "risk_factors": triage_res["risk_factors"],
            "algorithms": {
                "scenario": scenario_res["algorithm_used"],
                "triage": triage_res["algorithm_used"],
            },
        }

    def extract_features_from_evidence_event(self, event) -> Dict[str, Any]:
        """Extracts tabular features from an EvidenceEvent database model instance."""
        norm = event.normalized_fields or {}

        # 1. Hour of day
        hour = 12
        if hasattr(event, "timestamp_utc") and event.timestamp_utc:
            hour = event.timestamp_utc.hour

        # 2. USB connected
        cmd = str(norm.get("command_line", "")).lower()
        file_path = str(norm.get("file_path", "") or norm.get("target_file", "")).lower()
        proc_name = str(norm.get("process_name", "")).lower()
        desc = str(norm.get("description", "")).lower()
        event_type = str(event.event_type or "").lower()

        usb_connected = 1 if ("usb" in cmd or "usb" in file_path or "removable" in desc or "usb" in event_type) else 0

        # 3. Bytes transferred
        bytes_val = int(norm.get("bytes_transferred") or norm.get("bytes") or norm.get("size") or 0)

        # 4. Failed logins
        failed_logins = int(norm.get("failed_logins_24h") or (1 if event_type in ("logon_failure", "4625") else 0))

        # 5. Deleted after activity
        deleted = 1 if (
            "delete" in norm.get("file_action", "").lower()
            or "delete" in cmd
            or event_type in ("file_deletion", "event_log_cleared")
            or "rm " in cmd
        ) else 0

        # 6. Artifact Type
        artifact_type = "process_event"
        if "logon" in event_type or "login" in event_type:
            artifact_type = "login_event"
        elif "file" in event_type:
            artifact_type = "file_event"
        elif "usb" in event_type or usb_connected == 1:
            artifact_type = "usb_event"
        elif "network" in event_type or norm.get("dest_ip"):
            artifact_type = "web_upload" if bytes_val > 50000 else "download"
        elif "powershell" in event_type or "cmd" in proc_name:
            artifact_type = "process_event"

        # 7. Action
        action = "execute"
        if deleted:
            action = "delete"
        elif "download" in cmd or "curl" in cmd or "wget" in cmd or "webrequest" in cmd:
            action = "download"
        elif "upload" in cmd or bytes_val > 500000:
            action = "upload"
        elif "copy" in cmd or "xcopy" in cmd:
            action = "copy"
        elif norm.get("file_action") == "FileCreate":
            action = "create"
        elif norm.get("file_action") == "FileModify":
            action = "modify"
        elif "login" in artifact_type or "logon" in event_type:
            action = "logon"

        # 8. File extension
        ext = "none"
        for candidate in [file_path, cmd, proc_name]:
            if "." in candidate:
                parts = candidate.split("?")[0].split()[0].split(".")
                if len(parts) > 1 and len(parts[-1]) in (2, 3, 4) and parts[-1].isalnum():
                    ext = parts[-1].lower()
                    break

        # 9. External destination
        dest_ip = norm.get("dest_ip") or ""
        external_dest = "none"
        if dest_ip:
            if dest_ip.startswith("10.") or dest_ip.startswith("192.168.") or dest_ip.startswith("127."):
                external_dest = "internal"
            else:
                external_dest = "cloud_storage" if bytes_val > 1000000 else "unknown"
        elif "cloud" in cmd or "s3" in cmd or "mega" in cmd:
            external_dest = "cloud_storage"
        elif "mail" in cmd:
            external_dest = "personal_mail"

        return {
            "hour_of_day": hour,
            "usb_connected": usb_connected,
            "bytes_transferred": bytes_val,
            "failed_logins_24h": failed_logins,
            "deleted_after_activity": deleted,
            "artifact_type": artifact_type,
            "action": action,
            "file_extension": ext,
            "external_destination": external_dest,
        }


_engine_instance: Optional[MLTriageEngine] = None


def get_triage_engine() -> MLTriageEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MLTriageEngine()
    return _engine_instance
