
from pathlib import Path
import warnings

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_recall_fscore_support,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    LabelEncoder,
    OneHotEncoder,
    StandardScaler,
)
from sklearn.dummy import DummyClassifier

from xgboost import XGBClassifier
from sentence_transformers import SentenceTransformer

warnings.filterwarnings("ignore", category=FutureWarning)

# --------------------------------------------------
# 1. CONFIGURATION
# --------------------------------------------------

DATA_FILE = Path("synthetic_forensic_triage.csv")
OUTPUT_DIR = Path("results")
OUTPUT_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42

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

# Task A: binary prioritization
# Task B: three-class scenario prediction
TASKS = {
    "triage_label": NUMERIC_COLS + CATEGORICAL_COLS + ["scenario"],
    "scenario": NUMERIC_COLS + CATEGORICAL_COLS,
}

# --------------------------------------------------
# 2. LOAD AND VALIDATE DATA
# --------------------------------------------------

if not DATA_FILE.exists():
    raise FileNotFoundError(
        f"Cannot find {DATA_FILE}. Put it beside train_model.py."
    )

df = pd.read_csv(DATA_FILE)

required_cols = (
    set(NUMERIC_COLS)
    | set(CATEGORICAL_COLS)
    | {"case_id", "scenario", "triage_label"}
)

missing = required_cols - set(df.columns)
if missing:
    raise ValueError(f"Missing required columns: {sorted(missing)}")

if df["case_id"].isna().any():
    raise ValueError("case_id contains missing values.")

df = df.dropna(subset=["scenario", "triage_label"]).reset_index(drop=True)

print("=" * 65)
print("DATASET SUMMARY")
print("=" * 65)
print("Rows:", len(df))
print("Columns:", len(df.columns))
print("Unique cases:", df["case_id"].nunique())
print("\nTriage labels:")
print(df["triage_label"].value_counts())
print("\nScenario labels:")
print(df["scenario"].value_counts())

# --------------------------------------------------
# 3. CASE-BASED TRAIN / TEST SPLIT
# --------------------------------------------------

if df["case_id"].nunique() < 4:
    raise ValueError(
        "Too few distinct cases for a meaningful case-separated split."
    )

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.25,
    random_state=RANDOM_STATE,
)

train_idx, test_idx = next(
    splitter.split(df, groups=df["case_id"])
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

print("\nTraining rows:", len(train_df))
print("Testing rows:", len(test_df))
print("Training cases:", train_df["case_id"].nunique())
print("Testing cases:", test_df["case_id"].nunique())

overlap = set(train_df["case_id"]) & set(test_df["case_id"])
assert not overlap, "Case leakage detected!"

# --------------------------------------------------
# 4. PREPROCESSING
# --------------------------------------------------

def make_preprocessor(features):
    numeric = [c for c in NUMERIC_COLS if c in features]
    categorical = [
        c for c in CATEGORICAL_COLS + ["scenario"]
        if c in features
    ]

    transformers = []

    if numeric:
        numeric_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("numeric", numeric_pipeline, numeric))

    if categorical:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ])
        transformers.append(
            ("categorical", categorical_pipeline, categorical)
        )

    return ColumnTransformer(transformers)


def make_text(frame, features):
    return (
        frame[features]
        .fillna("unknown")
        .astype(str)
        .agg(" | ".join, axis=1)
    )


def build_tabular_models(features, task):
    return {
        "Logistic Regression": Pipeline([
            ("preprocess", make_preprocessor(features)),
            ("classifier", LogisticRegression(
                C=0.1,
                max_iter=3000,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            )),
        ]),

        "Random Forest": Pipeline([
            ("preprocess", make_preprocessor(features)),
            ("classifier", RandomForestClassifier(
                n_estimators=300,
                max_depth=8,
                min_samples_split=10,
                min_samples_leaf=5,
                max_features="sqrt",
                class_weight="balanced_subsample",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            )),
        ]),

        "XGBoost": Pipeline([
            ("preprocess", make_preprocessor(features)),
            ("classifier", XGBClassifier(
                n_estimators=120,
                max_depth=3,
                learning_rate=0.03,
                min_child_weight=5,
                gamma=0.2,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_lambda=5.0,
                reg_alpha=0.5,
                eval_metric=(
                    "logloss" if task == "triage_label"
                    else "mlogloss"
                ),
                random_state=RANDOM_STATE,
                n_jobs=-1,
            )),
        ]),
    }


# --------------------------------------------------
# 5. TRAIN AND EVALUATE
# --------------------------------------------------

all_results = []
all_predictions = []

for task, features in TASKS.items():
    print("\n" + "=" * 65)
    print(f"TASK: {task}")
    print("=" * 65)

    X_train = train_df[features]
    X_test = test_df[features]

    y_train = train_df[task].astype(str)
    y_test = test_df[task].astype(str)

    # Labels are learned from training data only.
    encoder = LabelEncoder()
    y_train_encoded = encoder.fit_transform(y_train)

    known_test = y_test.isin(encoder.classes_)
    X_test = X_test.loc[known_test]
    y_test = y_test.loc[known_test]
    test_subset = test_df.loc[known_test].copy()

    if len(test_subset) == 0:
        print("No test labels overlap with training labels; skipping task.")
        continue

    y_test_encoded = encoder.transform(y_test)

    print("Classes:", list(encoder.classes_))
    print("Training class counts:")
    print(y_train.value_counts())

    # Baseline: always predict the most frequent training class.
    models = {
        "Dummy baseline": DummyClassifier(strategy="most_frequent"),
        **build_tabular_models(features, task),
        "TF-IDF + Logistic Regression": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=2000,
                min_df=2,
                sublinear_tf=True,
            )),
            ("classifier", LogisticRegression(
                C=0.1,
                max_iter=3000,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            )),
        ]),
    }

    X_train_text = make_text(train_df, features)
    X_test_text = make_text(test_subset, features)

    for model_name, model in models.items():
        print(f"\n--- {model_name} ---")

        if model_name == "TF-IDF + Logistic Regression":
            xtr = X_train_text
            xte = X_test_text
        else:
            xtr = X_train
            xte = X_test

        model.fit(xtr, y_train_encoded)

        train_predictions = model.predict(xtr)
        test_predictions = model.predict(xte)

        train_accuracy = accuracy_score(
            y_train_encoded, train_predictions
        )
        test_accuracy = accuracy_score(
            y_test_encoded, test_predictions
        )

        train_f1 = f1_score(
            y_train_encoded, train_predictions,
            average="macro", zero_division=0
        )
        test_f1 = f1_score(
            y_test_encoded, test_predictions,
            average="macro", zero_division=0
        )

        precision, recall, _, _ = precision_recall_fscore_support(
            y_test_encoded,
            test_predictions,
            average="macro",
            zero_division=0,
        )

        print(f"Train accuracy: {train_accuracy:.3f}")
        print(f"Test accuracy:  {test_accuracy:.3f}")
        print(f"Train macro F1: {train_f1:.3f}")
        print(f"Test macro F1:  {test_f1:.3f}")
        print("\nTest classification report:")
        print(classification_report(
            y_test_encoded,
            test_predictions,
            labels=np.arange(len(encoder.classes_)),
            target_names=encoder.classes_,
            zero_division=0,
        ))

        all_results.append({
            "task": task,
            "model": model_name,
            "train_accuracy": train_accuracy,
            "test_accuracy": test_accuracy,
            "train_macro_f1": train_f1,
            "test_macro_f1": test_f1,
            "test_macro_precision": precision,
            "test_macro_recall": recall,
        })

        for row_index, pred in zip(
            test_subset.index, test_predictions
        ):
            all_predictions.append({
                "task": task,
                "model": model_name,
                "case_id": df.loc[row_index, "case_id"],
                "actual": df.loc[row_index, task],
                "predicted": encoder.inverse_transform([pred])[0],
            })

    # --------------------------------------------------
    # 6. TRANSFORMER EMBEDDINGS + LOGISTIC REGRESSION
    # --------------------------------------------------

    print("\n--- Transformer embeddings + Logistic Regression ---")
    print("Loading pretrained sentence Transformer...")

    transformer = SentenceTransformer("all-MiniLM-L6-v2")

    train_embeddings = transformer.encode(
        X_train_text.tolist(),
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    test_embeddings = transformer.encode(
        X_test_text.tolist(),
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    transformer_classifier = LogisticRegression(
        C=0.1,
        max_iter=3000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    )

    transformer_classifier.fit(
        train_embeddings, y_train_encoded
    )

    train_predictions = transformer_classifier.predict(
        train_embeddings
    )
    test_predictions = transformer_classifier.predict(
        test_embeddings
    )

    train_accuracy = accuracy_score(
        y_train_encoded, train_predictions
    )
    test_accuracy = accuracy_score(
        y_test_encoded, test_predictions
    )

    train_f1 = f1_score(
        y_train_encoded, train_predictions,
        average="macro", zero_division=0
    )
    test_f1 = f1_score(
        y_test_encoded, test_predictions,
        average="macro", zero_division=0
    )

    precision, recall, _, _ = precision_recall_fscore_support(
        y_test_encoded,
        test_predictions,
        average="macro",
        zero_division=0,
    )

    print(f"Train accuracy: {train_accuracy:.3f}")
    print(f"Test accuracy:  {test_accuracy:.3f}")
    print(f"Train macro F1: {train_f1:.3f}")
    print(f"Test macro F1:  {test_f1:.3f}")
    print("\nTest classification report:")
    print(classification_report(
        y_test_encoded,
        test_predictions,
        labels=np.arange(len(encoder.classes_)),
        target_names=encoder.classes_,
        zero_division=0,
    ))

    all_results.append({
        "task": task,
        "model": "Transformer embeddings + Logistic Regression",
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy,
        "train_macro_f1": train_f1,
        "test_macro_f1": test_f1,
        "test_macro_precision": precision,
        "test_macro_recall": recall,
    })

    for row_index, pred in zip(
        test_subset.index, test_predictions
    ):
        all_predictions.append({
            "task": task,
            "model": "Transformer embeddings + Logistic Regression",
            "case_id": df.loc[row_index, "case_id"],
            "actual": df.loc[row_index, task],
            "predicted": encoder.inverse_transform([pred])[0],
        })


# --------------------------------------------------
# 7. SAVE COMPARISON AND TEST PREDICTIONS
# --------------------------------------------------

results_df = pd.DataFrame(all_results)

if not results_df.empty:
    results_df = results_df.sort_values(
        ["task", "test_macro_f1"],
        ascending=[True, False],
    )

    results_df.to_csv(
        OUTPUT_DIR / "model_comparison.csv", index=False
    )

    print("\nFINAL MODEL COMPARISON")
    print(results_df.to_string(index=False))

pd.DataFrame(all_predictions).to_csv(
    OUTPUT_DIR / "test_predictions.csv", index=False
)

print("\nFinished.")
print("Saved results/model_comparison.csv")
print("Saved results/test_predictions.csv")
print(
    "\nReminder: the dataset and labels are synthetic. "
    "These scores do not validate real-world forensic accuracy."
)
