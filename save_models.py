
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

DATA_FILE = Path("synthetic_forensic_triage.csv")
MODEL_DIR = Path("saved_models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

NUMERIC_COLS = [
    "hour_of_day", "usb_connected", "bytes_transferred",
    "failed_logins_24h", "deleted_after_activity",
]
CATEGORICAL_COLS = [
    "artifact_type", "action", "file_extension", "external_destination",
]

df = pd.read_csv(DATA_FILE).dropna(subset=["triage_label", "scenario"])

TASKS = {
    "triage_label": NUMERIC_COLS + CATEGORICAL_COLS + ["scenario"],
    "scenario": NUMERIC_COLS + CATEGORICAL_COLS,
}


def make_text(frame, features):
    return (
        frame[features].fillna("unknown").astype(str)
        .agg(" | ".join, axis=1)
    )


def make_preprocessor(features):
    numeric = [c for c in NUMERIC_COLS if c in features]
    categorical = [
        c for c in CATEGORICAL_COLS + ["scenario"] if c in features
    ]
    transformers = []

    if numeric:
        transformers.append((
            "numeric",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]),
            numeric,
        ))

    if categorical:
        transformers.append((
            "categorical",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]),
            categorical,
        ))

    return ColumnTransformer(transformers)


for task, features in TASKS.items():
    subset = df.dropna(subset=[task]).copy()
    X = subset[features]
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(subset[task].astype(str))

    models = {
        "logistic_regression": Pipeline([
            ("prep", make_preprocessor(features)),
            ("model", LogisticRegression(
                max_iter=2000, class_weight="balanced", random_state=42
            )),
        ]),
        "random_forest": Pipeline([
            ("prep", make_preprocessor(features)),
            ("model", RandomForestClassifier(
                n_estimators=200, class_weight="balanced",
                random_state=42, n_jobs=-1
            )),
        ]),
        "xgboost": Pipeline([
            ("prep", make_preprocessor(features)),
            ("model", XGBClassifier(
                n_estimators=150, max_depth=4, learning_rate=0.05,
                eval_metric="logloss" if task == "triage_label" else "mlogloss",
                random_state=42, n_jobs=-1
            )),
        ]),
        "tfidf_logistic_regression": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2), max_features=5000
            )),
            ("model", LogisticRegression(
                max_iter=2000, class_weight="balanced", random_state=42
            )),
        ]),
    }

    text_X = make_text(subset, features)

    for name, model in models.items():
        model_input = text_X if name == "tfidf_logistic_regression" else X
        model.fit(model_input, y)

        artifact = {
            "model": model,
            "label_encoder": label_encoder,
            "features": features,
            "task": task,
            "model_name": name,
            "synthetic_training_data": True,
        }

        path = MODEL_DIR / f"{task}__{name}.joblib"
        joblib.dump(artifact, path)
        print("Saved:", path)

print("\nSaved all eight models.")
print("Models are trained on the full synthetic dataset.")
