
from pathlib import Path
import joblib
import pandas as pd

# Choose: "triage_label" or "scenario"
TASK = "triage_label"

# Choose: "logistic_regression", "random_forest",
# "xgboost", or "tfidf_logistic_regression"
MODEL_NAME = "logistic_regression"

MODEL_PATH = Path("saved_models") / f"{TASK}__{MODEL_NAME}.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"{MODEL_PATH} not found. Run save_models.py first."
    )

artifact = joblib.load(MODEL_PATH)
model = artifact["model"]
label_encoder = artifact["label_encoder"]
features = artifact["features"]

# Example event. Edit values to test another event.
new_event = {
    "hour_of_day": 3,
    "usb_connected": 1,
    "bytes_transferred": 200_000_000,
    "failed_logins_24h": 8,
    "deleted_after_activity": 1,
    "artifact_type": "usb_event",
    "action": "write_usb",
    "file_extension": "pdf",
    "external_destination": "cloud_storage",
    "scenario": "data_leakage",
}

X = pd.DataFrame([new_event]).reindex(columns=features)

if MODEL_NAME == "tfidf_logistic_regression":
    model_input = X.fillna("unknown").astype(str).agg(" | ".join, axis=1)
else:
    model_input = X

encoded_prediction = model.predict(model_input)[0]
prediction = label_encoder.inverse_transform([encoded_prediction])[0]

print(f"\nTask: {TASK}")
print(f"Model: {MODEL_NAME}")
print(f"Prediction: {prediction}")

if TASK == "triage_label":
    print(
        "Interpretation:",
        "Flag for review" if prediction == "1"
        else "Lower risk; not flagged"
    )

if hasattr(model, "predict_proba"):
    probabilities = model.predict_proba(model_input)[0]
    classifier = model.named_steps["model"]
    classes = list(classifier.classes_)

    if TASK == "triage_label":
        positive_class = label_encoder.transform(["1"])[0]
        index = classes.index(positive_class)
        print(f"Probability of label 1: {probabilities[index]:.2%}")
    else:
        print("Class probabilities:")
        for class_id, probability in zip(classes, probabilities):
            label = label_encoder.inverse_transform([class_id])[0]
            print(f"  {label}: {probability:.2%}")
