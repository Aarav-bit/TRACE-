"use client";

import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  HardDrive,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  fetchCases,
  fetchMLModels,
  predictMLEvent,
  triageCaseEvents,
  seedDemoCase,
  MLModelsInfo,
  MLPredictResponse,
  MLCaseTriageResponse,
} from "@/lib/api";
import { Case } from "@/lib/types";

export default function MLTriagePage() {
  const [activeTab, setActiveTab] = useState<"predict" | "case" | "models">("predict");
  const [modelsInfo, setModelsInfo] = useState<MLModelsInfo | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  // Cases for batch triage
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [caseTriageResult, setCaseTriageResult] = useState<MLCaseTriageResponse | null>(null);
  const [loadingCaseTriage, setLoadingCaseTriage] = useState(false);

  // Single event prediction state
  const [hourOfDay, setHourOfDay] = useState<number>(3);
  const [usbConnected, setUsbConnected] = useState<boolean>(true);
  const [bytesTransferred, setBytesTransferred] = useState<number>(200000000);
  const [failedLogins, setFailedLogins] = useState<number>(8);
  const [deletedActivity, setDeletedActivity] = useState<boolean>(true);
  const [artifactType, setArtifactType] = useState<string>("usb_event");
  const [action, setAction] = useState<string>("write_usb");
  const [fileExtension, setFileExtension] = useState<string>("pdf");
  const [externalDestination, setExternalDestination] = useState<string>("cloud_storage");
  const [scenarioAlgo, setScenarioAlgo] = useState<string>("tfidf_logistic_regression");
  const [triageAlgo, setTriageAlgo] = useState<string>("xgboost");

  // Live prediction result
  const [predictResult, setPredictResult] = useState<MLPredictResponse | null>(null);
  const [predicting, setPredicting] = useState<boolean>(false);

  // Load models and cases on mount
  useEffect(() => {
    loadModelsAndCases();
  }, []);

  const loadModelsAndCases = async () => {
    setLoadingModels(true);
    try {
      const [mInfo, caseList] = await Promise.all([fetchMLModels(), fetchCases()]);
      setModelsInfo(mInfo);
      setCases(caseList);
      if (caseList.length > 0) {
        setSelectedCaseId(caseList[0].id);
      }
    } catch (err) {
      console.error("Failed to load ML models or cases", err);
    } finally {
      setLoadingModels(false);
    }
  };

  // Run real-time prediction
  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await predictMLEvent({
        hour_of_day: hourOfDay,
        usb_connected: usbConnected ? 1 : 0,
        bytes_transferred: bytesTransferred,
        failed_logins_24h: failedLogins,
        deleted_after_activity: deletedActivity ? 1 : 0,
        artifact_type: artifactType,
        action: action,
        file_extension: fileExtension,
        external_destination: externalDestination,
        scenario_algorithm: scenarioAlgo,
        triage_algorithm: triageAlgo,
      });
      setPredictResult(res);
    } catch (err) {
      console.error("Prediction failed", err);
    } finally {
      setPredicting(false);
    }
  };

  // Automatic Real-Time Live Inference: whenever ANY feature, toggle, or algorithm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePredict();
    }, 120);
    return () => clearTimeout(timer);
  }, [
    hourOfDay,
    usbConnected,
    bytesTransferred,
    failedLogins,
    deletedActivity,
    artifactType,
    action,
    fileExtension,
    externalDestination,
    scenarioAlgo,
    triageAlgo,
  ]);

  // Automatic Case Triage: automatically triage case when selectedCaseId changes or tab switches
  useEffect(() => {
    if (selectedCaseId && (activeTab === "case" || !caseTriageResult)) {
      handleRunCaseTriage();
    }
  }, [selectedCaseId, activeTab, scenarioAlgo, triageAlgo]);

  // Run case batch triage
  const handleRunCaseTriage = async () => {
    if (!selectedCaseId) return;
    setLoadingCaseTriage(true);
    try {
      const res = await triageCaseEvents(selectedCaseId, scenarioAlgo, triageAlgo);
      setCaseTriageResult(res);
    } catch (err) {
      console.error("Case triage failed", err);
    } finally {
      setLoadingCaseTriage(false);
    }
  };

  const handleSeedDemoAndTriage = async () => {
    try {
      const res = await seedDemoCase("complete");
      await loadModelsAndCases();
      setSelectedCaseId(res.case_id);
      const triageRes = await triageCaseEvents(res.case_id, scenarioAlgo, triageAlgo);
      setCaseTriageResult(triageRes);
    } catch (err) {
      console.error("Demo seeding failed", err);
    }
  };

  const getRiskBadgeColor = (tier: string) => {
    switch (tier) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
      case "LOW":
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Machine Learning Forensic Triage
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              Branch: aviral
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Supervised multi-class scenario classification & risk triage models trained on forensic telemetry.
            Classifies threat vectors (data leakage, timeline anomaly, suspicious web activity) and scores incident severity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("predict")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "predict"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Live Simulator
          </button>
          <button
            onClick={() => setActiveTab("case")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "case"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Case Triage
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "models"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Models & Benchmarks
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE SIMULATOR */}
      {activeTab === "predict" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Feature Configurator */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Forensic Event Feature Configurator
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-Predict: Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tune any slider or toggle — model re-evaluates automatically in real time.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setHourOfDay(3);
                    setUsbConnected(true);
                    setBytesTransferred(200000000);
                    setFailedLogins(8);
                    setDeletedActivity(true);
                    setArtifactType("usb_event");
                    setAction("write_usb");
                    setFileExtension("pdf");
                    setExternalDestination("cloud_storage");
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-rose-50 text-rose-700 rounded-md border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Exfil Attack
                </button>
                <button
                  onClick={() => {
                    setHourOfDay(14);
                    setUsbConnected(false);
                    setBytesTransferred(4500);
                    setFailedLogins(0);
                    setDeletedActivity(false);
                    setArtifactType("process_event");
                    setAction("execute");
                    setFileExtension("exe");
                    setExternalDestination("none");
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  Normal Ops
                </button>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hour of Day */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Hour of Day (0–23)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    hourOfDay < 6 || hourOfDay > 21
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {hourOfDay}:00 {hourOfDay < 6 || hourOfDay > 21 ? "(Off-hours)" : "(Business)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={hourOfDay}
                  onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Bytes Transferred */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Bytes Transferred</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {(bytesTransferred / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <input
                  type="number"
                  value={bytesTransferred}
                  onChange={(e) => setBytesTransferred(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Failed Logins */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Failed Logins (24h)</span>
                  <span className={`font-mono text-[11px] font-bold ${failedLogins >= 3 ? "text-rose-600" : "text-slate-500"}`}>
                    {failedLogins} attempts
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={failedLogins}
                  onChange={(e) => setFailedLogins(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Artifact Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Artifact Type</label>
                <select
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="usb_event">usb_event</option>
                  <option value="process_event">process_event</option>
                  <option value="login_event">login_event</option>
                  <option value="file_event">file_event</option>
                  <option value="download">download</option>
                  <option value="web_upload">web_upload</option>
                  <option value="email_event">email_event</option>
                  <option value="archive_file">archive_file</option>
                </select>
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="write_usb">write_usb</option>
                  <option value="execute">execute</option>
                  <option value="download">download</option>
                  <option value="upload">upload</option>
                  <option value="copy">copy</option>
                  <option value="delete">delete</option>
                  <option value="modify">modify</option>
                  <option value="read">read</option>
                  <option value="visit">visit</option>
                  <option value="email_attachment">email_attachment</option>
                </select>
              </div>

              {/* File Extension */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">File Extension</label>
                <select
                  value={fileExtension}
                  onChange={(e) => setFileExtension(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="pdf">pdf</option>
                  <option value="exe">exe</option>
                  <option value="zip">zip</option>
                  <option value="docx">docx</option>
                  <option value="csv">csv</option>
                  <option value="log">log</option>
                  <option value="html">html</option>
                  <option value="none">none</option>
                </select>
              </div>

              {/* External Destination */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">External Destination</label>
                <select
                  value={externalDestination}
                  onChange={(e) => setExternalDestination(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="cloud_storage">cloud_storage</option>
                  <option value="personal_mail">personal_mail</option>
                  <option value="new_domain">new_domain</option>
                  <option value="known_site">known_site</option>
                  <option value="internal">internal</option>
                  <option value="unknown">unknown</option>
                  <option value="none">none</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2.5 justify-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={usbConnected}
                    onChange={(e) => setUsbConnected(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">USB Connected</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deletedActivity}
                    onChange={(e) => setDeletedActivity(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Deleted After Activity (Anti-Forensics)</span>
                </label>
              </div>
            </div>

            {/* Model Algorithm Selectors */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Scenario Model
                </label>
                <select
                  value={scenarioAlgo}
                  onChange={(e) => setScenarioAlgo(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                >
                  <option value="tfidf_logistic_regression">TF-IDF + Logistic Regression (100% F1)</option>
                  <option value="logistic_regression">Logistic Regression (99.6% F1)</option>
                  <option value="random_forest">Random Forest (98.8% F1)</option>
                  <option value="xgboost">XGBoost (98.3% F1)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Triage Model
                </label>
                <select
                  value={triageAlgo}
                  onChange={(e) => setTriageAlgo(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                >
                  <option value="xgboost">XGBoost (86.9% Precision)</option>
                  <option value="random_forest">Random Forest (Balanced)</option>
                  <option value="tfidf_logistic_regression">TF-IDF + Logistic Regression</option>
                  <option value="logistic_regression">Logistic Regression</option>
                </select>
              </div>
            </div>

            {/* Real-time Status Banner & Force Re-Run button */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${predicting ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {predicting ? "Computing Real-Time Inference..." : "Live Auto-Inference Active"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Predictions refresh automatically on every feature change
                  </span>
                </div>
              </div>

              <button
                onClick={handlePredict}
                disabled={predicting}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {predicting ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 fill-white" />
                )}
                Force Run
              </button>
            </div>
          </div>

          {/* Right Panel: Prediction Results */}
          <div className="lg:col-span-5 space-y-6">
            {predictResult ? (
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Model Inference Output
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(
                      predictResult.risk_tier
                    )}`}
                  >
                    {predictResult.risk_tier} RISK
                  </span>
                </div>

                {/* Score & Gauge */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Triage Risk Score</div>
                    <div className="text-3xl font-black tracking-tight text-white mt-1">
                      {predictResult.risk_score}
                      <span className="text-sm font-normal text-slate-400"> / 100</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Flagged for Analyst Review:{" "}
                      <span className={predictResult.flagged ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {predictResult.flagged ? "YES (HIGH PRIORITY)" : "NO"}
                      </span>
                    </div>
                  </div>

                  {/* Circular/Meter representation */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="text-sm font-black font-mono">
                      {(predictResult.probability_flagged * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Scenario Classification Card */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      Attack Scenario Vector
                    </span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">
                      {(predictResult.scenario_confidence * 100).toFixed(1)}% Conf
                    </span>
                  </div>

                  <div className="text-lg font-bold text-indigo-300 capitalize flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    {predictResult.scenario.replace(/_/g, " ")}
                  </div>

                  {/* Probability Breakdown */}
                  {predictResult.scenario_probabilities && (
                    <div className="space-y-1.5 pt-2">
                      {Object.entries(predictResult.scenario_probabilities).map(([scen, prob]) => (
                        <div key={scen} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span className="capitalize">{scen.replace(/_/g, " ")}</span>
                            <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(prob * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Risk Factors */}
                {predictResult.risk_factors.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      Detected Forensic Anomaly Flags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {predictResult.risk_factors.map((factor, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5 font-medium"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Algorithms footnote */}
                <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between">
                  <span>Scenario: {predictResult.algorithms.scenario}</span>
                  <span>Triage: {predictResult.algorithms.triage}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Click &ldquo;Run Live Triage Inference&rdquo; to evaluate the model.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CASE EVIDENCE BATCH TRIAGE */}
      {activeTab === "case" && (
        <div className="space-y-6">
          {/* Case Picker & Trigger Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="w-full">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Select Active Investigation Case
                </label>
                {cases.length > 0 ? (
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="mt-1 text-xs font-semibold text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 italic">No cases in database.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleSeedDemoAndTriage}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Seed Complete Demo Case
              </button>

              <button
                onClick={handleRunCaseTriage}
                disabled={!selectedCaseId || loadingCaseTriage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {loadingCaseTriage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Running Batch ML Triage...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Run ML Triage On Case
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Case Triage Results */}
          {caseTriageResult && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Case Threat Level</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(
                        caseTriageResult.case_risk_tier
                      )}`}
                    >
                      {caseTriageResult.case_risk_tier}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Max: {caseTriageResult.max_risk_score}/100
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Primary Scenario</span>
                  <div className="text-base font-bold text-indigo-700 capitalize">
                    {caseTriageResult.primary_scenario.replace(/_/g, " ")}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Flagged Events</span>
                  <div className="text-2xl font-bold text-slate-900">
                    {caseTriageResult.flagged_count}
                    <span className="text-xs font-normal text-slate-400"> / {caseTriageResult.total_events} events</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Event Risk</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono">
                    {caseTriageResult.average_risk_score}
                    <span className="text-xs font-normal text-slate-400"> / 100</span>
                  </div>
                </div>
              </div>

              {/* Ranked Events Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Ranked Evidence Events (Prioritized By ML Risk Score)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {caseTriageResult.ranked_events.length} events analyzed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4">Record ID</th>
                        <th className="py-2.5 px-4">Event Type</th>
                        <th className="py-2.5 px-4">Predicted Scenario</th>
                        <th className="py-2.5 px-4">Risk Tier</th>
                        <th className="py-2.5 px-4">Risk Score</th>
                        <th className="py-2.5 px-4">Forensic Indicators</th>
                        <th className="py-2.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {caseTriageResult.ranked_events.map((ev) => (
                        <tr
                          key={ev.event_id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            ev.flagged ? "bg-rose-50/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {ev.source_record_id}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {ev.event_type}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                              {ev.scenario.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getRiskBadgeColor(
                                ev.risk_tier
                              )}`}
                            >
                              {ev.risk_tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {ev.risk_score}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {ev.risk_factors.map((f, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                                >
                                  {f}
                                </span>
                              ))}
                              {ev.risk_factors.length === 0 && (
                                <span className="text-[10px] text-slate-400">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ev.description}>
                            {ev.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODELS & BENCHMARKS */}
      {activeTab === "models" && (
        <div className="space-y-6">
          {/* Overview of 8 models */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario Models */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Scenario Classification Models
                  </h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold">
                  Task: scenario
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Predicts forensic incident category: data leakage, timeline anomaly, or suspicious web activity.
              </p>
              <div className="space-y-2">
                {modelsInfo?.models
                  .filter((m) => m.task === "scenario")
                  .map((m) => (
                    <div
                      key={m.algorithm}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {m.algorithm}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {m.available ? "Loaded (.joblib)" : "Missing"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Triage Models */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Triage Risk Models
                  </h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-semibold">
                  Task: triage_label
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Predicts whether an event warrants high priority escalation (Flagged: 1 vs Lower risk: 0).
              </p>
              <div className="space-y-2">
                {modelsInfo?.models
                  .filter((m) => m.task === "triage_label")
                  .map((m) => (
                    <div
                      key={m.algorithm}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {m.algorithm}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {m.available ? "Loaded (.joblib)" : "Missing"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Model Comparison Table */}
          {modelsInfo?.benchmarks && modelsInfo.benchmarks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Model Comparison & Evaluation Benchmarks (results/model_comparison.csv)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cross-validated metrics across training and test splits.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">Task</th>
                      <th className="py-2.5 px-4">Model Architecture</th>
                      <th className="py-2.5 px-4">Test Accuracy</th>
                      <th className="py-2.5 px-4">Test Macro F1</th>
                      <th className="py-2.5 px-4">Precision</th>
                      <th className="py-2.5 px-4">Recall</th>
                      <th className="py-2.5 px-4">Train Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modelsInfo.benchmarks.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              b.task === "scenario"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {b.task}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{b.model}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {(b.test_accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {(b.test_macro_f1 * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {(b.test_macro_precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {(b.test_macro_recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {(b.train_accuracy * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
