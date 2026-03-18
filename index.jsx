import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════
// BARÈME ICC GENÈVE 2025 — Source officielle: getax.ch/guide/declaration2025
// ═══════════════════════════════════════════════════════════════════
const ICC_BRACKETS_2025 = [
  { from: 0, to: 18649, rate: 0.0 },
  { from: 18650, to: 22469, rate: 0.073 },
  { from: 22470, to: 24716, rate: 0.082 },
  { from: 24717, to: 26962, rate: 0.091 },
  { from: 26963, to: 29210, rate: 0.1 },
  { from: 29211, to: 34827, rate: 0.109 },
  { from: 34828, to: 39320, rate: 0.113 },
  { from: 39321, to: 43815, rate: 0.123 },
  { from: 43816, to: 48309, rate: 0.128 },
  { from: 48310, to: 77518, rate: 0.132 },
  { from: 77519, to: 126950, rate: 0.142 },
  { from: 126951, to: 170764, rate: 0.15 },
  { from: 170765, to: 193234, rate: 0.156 },
  { from: 193235, to: 276369, rate: 0.158 },
  { from: 276370, to: 294345, rate: 0.16 },
  { from: 294346, to: 414554, rate: 0.168 },
  { from: 414555, to: 649355, rate: 0.176 },
  { from: 649356, to: Infinity, rate: 0.18 },
];

// ═══════════════════════════════════════════════════════════════════
// BARÈME IFD 2025 — Personnes seules (art. 36 al. 1 LIFD)
// ═══════════════════════════════════════════════════════════════════
const IFD_SINGLE_2025 = [
  { from: 0, to: 14500, rate: 0.0 },
  { from: 14501, to: 31600, rate: 0.0077 },
  { from: 31601, to: 41400, rate: 0.0088 },
  { from: 41401, to: 55200, rate: 0.0266 },
  { from: 55201, to: 72500, rate: 0.0299 },
  { from: 72501, to: 78100, rate: 0.0511 },
  { from: 78101, to: 103600, rate: 0.0611 },
  { from: 103601, to: 134600, rate: 0.0691 },
  { from: 134601, to: 176000, rate: 0.0791 },
  { from: 176001, to: 755200, rate: 0.115 },
  { from: 755201, to: 895900, rate: 0.125 }, // includes Zurich surtax style
  { from: 895901, to: Infinity, rate: 0.115 },
];

// IFD Couples mariés (art. 36 al. 2 LIFD)
const IFD_MARRIED_2025 = [
  { from: 0, to: 28300, rate: 0.0 },
  { from: 28301, to: 50900, rate: 0.01 },
  { from: 50901, to: 58400, rate: 0.02 },
  { from: 58401, to: 75300, rate: 0.03 },
  { from: 75301, to: 90300, rate: 0.04 },
  { from: 90301, to: 103400, rate: 0.05 },
  { from: 103401, to: 114700, rate: 0.06 },
  { from: 114701, to: 124200, rate: 0.07 },
  { from: 124201, to: 131700, rate: 0.08 },
  { from: 131701, to: 137300, rate: 0.09 },
  { from: 137301, to: 141200, rate: 0.1 },
  { from: 141201, to: 143100, rate: 0.11 },
  { from: 143101, to: 145000, rate: 0.12 },
  { from: 145001, to: 895900, rate: 0.13 },
  { from: 895901, to: Infinity, rate: 0.115 },
];

// Centimes additionnels communaux Genève 2025
const COMMUNES_GE = {
  "Genève (Ville)": 0.455,
  Carouge: 0.39,
  Lancy: 0.5,
  Meyrin: 0.44,
  Onex: 0.505,
  Vernier: 0.5,
  "Grand-Saconnex": 0.37,
  "Chêne-Bougeries": 0.31,
  "Chêne-Bourg": 0.44,
  Thônex: 0.44,
  "Plan-les-Ouates": 0.33,
  Bernex: 0.49,
  Confignon: 0.45,
  Veyrier: 0.34,
  Cologny: 0.27,
  Vandoeuvres: 0.29,
  "Collonge-Bellerive": 0.28,
  Genthod: 0.25,
  Bellevue: 0.3,
  "Pregny-Chambésy": 0.3,
  Puplinge: 0.39,
  Presinge: 0.35,
  Anières: 0.3,
  Corsier: 0.3,
  Hermance: 0.33,
  "Aire-la-Ville": 0.43,
  Avully: 0.51,
  Avusy: 0.48,
  Bardonnex: 0.42,
  Cartigny: 0.4,
  Céligny: 0.35,
  Chancy: 0.51,
  "Collex-Bossy": 0.39,
  Dardagny: 0.44,
  Gy: 0.41,
  Jussy: 0.36,
  Laconnex: 0.42,
  Meinier: 0.34,
  "Perly-Certoux": 0.44,
  Russin: 0.42,
  Satigny: 0.39,
  Soral: 0.46,
  Troinex: 0.36,
  Versoix: 0.39,
};

function calcBracketTax(income, brackets) {
  let tax = 0;
  for (const b of brackets) {
    if (income <= b.from) break;
    const taxableInBracket =
      Math.min(income, b.to) - b.from + (b.from === 0 ? 0 : 0);
    const actualFrom = b.from === 0 ? 0 : b.from;
    const effectiveIncome = Math.min(income, b.to === Infinity ? income : b.to);
    if (effectiveIncome >= actualFrom) {
      tax += (effectiveIncome - actualFrom + (actualFrom > 0 ? 1 : 0)) * b.rate;
    }
  }
  return tax;
}

function calcICCBase(taxableIncome, splitting) {
  let rateIncome = taxableIncome;
  if (splitting === "full") rateIncome = taxableIncome * 0.5;
  else if (splitting === "partial") rateIncome = taxableIncome * 0.5556;

  let baseTax = 0;
  for (const b of ICC_BRACKETS_2025) {
    if (rateIncome < b.from) break;
    const upper = b.to === Infinity ? rateIncome : Math.min(rateIncome, b.to);
    const lower = b.from === 0 ? 0 : b.from;
    if (upper >= lower) {
      baseTax += (upper - lower + (lower > 0 ? 1 : 0)) * b.rate;
    }
  }

  if (splitting === "full") baseTax *= 2;
  else if (splitting === "partial")
    baseTax = taxableIncome * (baseTax / rateIncome);

  return baseTax;
}

function calcIFD(taxableIncome, isMarried) {
  const brackets = isMarried ? IFD_MARRIED_2025 : IFD_SINGLE_2025;
  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome < b.from) break;
    const upper =
      b.to === Infinity ? taxableIncome : Math.min(taxableIncome, b.to);
    const lower = b.from === 0 ? 0 : b.from;
    if (upper >= lower) {
      tax += (upper - lower + (lower > 0 ? 1 : 0)) * b.rate;
    }
  }
  return tax;
}

const fmt = (n) =>
  new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
const fmtD = (n) =>
  new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 2 }).format(n);

const STEPS = ["situation", "revenus", "deductions", "source", "resultats"];
const STEP_LABELS = {
  situation: "Situation",
  revenus: "Revenus",
  deductions: "Déductions",
  source: "Impôt source",
  resultats: "Résultats",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #c4c9d4",
  borderRadius: "6px",
  fontSize: "15px",
  fontFamily: "'DM Sans', sans-serif",
  background: "#fafbfc",
  color: "#1a1a2e",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#3a3f5c",
  letterSpacing: "0.01em",
};

const hintStyle = {
  fontSize: "11.5px",
  color: "#7a7f99",
  marginTop: "2px",
  lineHeight: 1.4,
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}

function NumInput({ value, onChange, placeholder, suffix }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="number"
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
        placeholder={placeholder || "0"}
        style={inputStyle}
        min="0"
      />
      {suffix && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#999",
            fontSize: 13,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);

  // Situation
  const [statut, setStatut] = useState("celibataire");
  const [commune, setCommune] = useState("Genève (Ville)");
  const [enfants, setEnfants] = useState(0);

  // Revenus
  const [salaireBrut, setSalaireBrut] = useState(0);
  const [salaireConjoint, setSalaireConjoint] = useState(0);
  const [autresRevenus, setAutresRevenus] = useState(0);
  const [revenusMobiliers, setRevenusMobiliers] = useState(0);

  // Cotisations sociales (estimates)
  const [cotisAVS, setCotisAVS] = useState(0);
  const [cotisLPP, setCotisLPP] = useState(0);
  const [cotisAC, setCotisAC] = useState(0);

  // Déductions TOU
  const [pilier3a, setPilier3a] = useState(0);
  const [pilier3b, setPilier3b] = useState(0);
  const [rachat2e, setRachat2e] = useState(0);
  const [fraisTransport, setFraisTransport] = useState(0);
  const [fraisRepas, setFraisRepas] = useState(0);
  const [fraisFormation, setFraisFormation] = useState(0);
  const [primesMaladie, setPrimesMaladie] = useState(0);
  const [interetsDettes, setInteretsDettes] = useState(0);
  const [fraisGarde, setFraisGarde] = useState(0);
  const [pensionAlim, setPensionAlim] = useState(0);
  const [dons, setDons] = useState(0);
  const [fraisMedicaux, setFraisMedicaux] = useState(0);
  const [autresDeductions, setAutresDeductions] = useState(0);

  // Impôt source
  const [impotSourceAnnuel, setImpotSourceAnnuel] = useState(0);

  // Calculs
  const results = useMemo(() => {
    const isMarried = statut === "marie";
    const totalBrut =
      salaireBrut + salaireConjoint + autresRevenus + revenusMobiliers;
    const cotisationsSociales = cotisAVS + cotisLPP + cotisAC;
    const revenuNet = totalBrut - cotisationsSociales;

    const maxPilier3a = 7258; // 2025
    const eff3a = Math.min(pilier3a, maxPilier3a);

    // Plafonds 3b Genève (ICC uniquement)
    let max3bICC;
    if (isMarried) {
      max3bICC = 4854 + enfants * 1618;
    } else {
      max3bICC = 2427 + enfants * 1618;
    }
    const eff3b = Math.min(pilier3b, max3bICC);

    // Max frais formation IFD: 12'900, ICC: 12'000
    const maxFormation = 12000;
    const effFormation = Math.min(fraisFormation, maxFormation);

    // Max frais garde par enfant: 25'000 ICC, 25'500 IFD
    const maxGarde = enfants * 25000;
    const effGarde = Math.min(fraisGarde, maxGarde);

    // Total déductions
    const totalDeductionsICC =
      eff3a +
      eff3b +
      rachat2e +
      fraisTransport +
      fraisRepas +
      effFormation +
      primesMaladie +
      interetsDettes +
      effGarde +
      pensionAlim +
      dons +
      fraisMedicaux +
      autresDeductions;

    const totalDeductionsIFD =
      eff3a +
      rachat2e +
      fraisTransport +
      fraisRepas +
      Math.min(fraisFormation, 12900) +
      primesMaladie +
      interetsDettes +
      Math.min(fraisGarde, enfants * 25500) +
      pensionAlim +
      dons +
      fraisMedicaux +
      autresDeductions;

    const revenuImposableICC = Math.max(0, revenuNet - totalDeductionsICC);
    const revenuImposableIFD = Math.max(0, revenuNet - totalDeductionsIFD);

    // ICC
    const splitting = isMarried ? "full" : "none";
    const iccBase = calcICCBase(revenuImposableICC, splitting);
    const centimesCantonaux = iccBase * 0.475;
    const sousTotal1 = iccBase + centimesCantonaux;
    const diminution12 = sousTotal1 * 0.12;
    const apres12 = sousTotal1 - diminution12;
    const aideDomicile = iccBase * 0.01;
    const communeRate = COMMUNES_GE[commune] || 0.455;
    const centimesCommunaux = iccBase * communeRate;
    const iccTotal = apres12 + aideDomicile + centimesCommunaux;

    // IFD
    const ifdTotal = calcIFD(revenuImposableIFD, isMarried);

    // Taxe personnelle
    const taxePerso = 25;

    const impotTotalTOU = iccTotal + ifdTotal + taxePerso;
    const difference = impotSourceAnnuel - impotTotalTOU;

    return {
      totalBrut,
      cotisationsSociales,
      revenuNet,
      eff3a,
      eff3b,
      maxPilier3a,
      max3bICC,
      totalDeductionsICC,
      totalDeductionsIFD,
      revenuImposableICC,
      revenuImposableIFD,
      iccBase,
      centimesCantonaux,
      diminution12,
      aideDomicile,
      centimesCommunaux,
      communeRate,
      iccTotal,
      ifdTotal,
      taxePerso,
      impotTotalTOU,
      impotSourceAnnuel,
      difference,
    };
  }, [
    statut,
    commune,
    enfants,
    salaireBrut,
    salaireConjoint,
    autresRevenus,
    revenusMobiliers,
    cotisAVS,
    cotisLPP,
    cotisAC,
    pilier3a,
    pilier3b,
    rachat2e,
    fraisTransport,
    fraisRepas,
    fraisFormation,
    primesMaladie,
    interetsDettes,
    fraisGarde,
    pensionAlim,
    dons,
    fraisMedicaux,
    autresDeductions,
    impotSourceAnnuel,
  ]);

  const currentStep = STEPS[step];

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        background:
          "linear-gradient(135deg, #0f1628 0%, #1a2342 50%, #0d1117 100%)",
        minHeight: "100vh",
        color: "#e8eaf0",
        padding: "0",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#6b7aaa",
            marginBottom: 6,
          }}
        >
          Canton de Genève — Année fiscale 2025
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Simulateur TOU
        </h1>
        <div style={{ fontSize: "12px", color: "#8891b0", marginTop: 4 }}>
          Taxation Ordinaire Ultérieure — Permis B résident
        </div>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          padding: "16px 16px 8px",
        }}
      >
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            style={{
              flex: 1,
              maxWidth: 120,
              padding: "8px 4px",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: i === step ? 700 : 500,
              fontFamily: "inherit",
              cursor: "pointer",
              background: i === step ? "rgba(99,140,255,0.2)" : "transparent",
              color: i === step ? "#8bb4ff" : i < step ? "#6b7aaa" : "#3e4565",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background:
                  i < step
                    ? "#2d5a3d"
                    : i === step
                      ? "rgba(99,140,255,0.3)"
                      : "rgba(255,255,255,0.05)",
                color: i < step ? "#5ecc7b" : i === step ? "#8bb4ff" : "#555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 4px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{ maxWidth: 520, margin: "0 auto", padding: "12px 20px 100px" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: "12px",
            padding: "24px 20px",
            color: "#1a1a2e",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}
        >
          {/* ─── STEP 1: Situation ─── */}
          {currentStep === "situation" && (
            <>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  color: "#1a1a2e",
                }}
              >
                1. Situation personnelle
              </h2>
              <Field label="État civil">
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  style={inputStyle}
                >
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">
                    Marié·e / Partenariat enregistré
                  </option>
                  <option value="separe">Séparé·e / Divorcé·e</option>
                </select>
              </Field>
              <Field
                label="Commune de résidence"
                hint="Détermine les centimes additionnels communaux"
              >
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  style={{ ...inputStyle, maxHeight: 200 }}
                >
                  {Object.keys(COMMUNES_GE)
                    .sort()
                    .map((c) => (
                      <option key={c} value={c}>
                        {c} ({(COMMUNES_GE[c] * 100).toFixed(1)}%)
                      </option>
                    ))}
                </select>
              </Field>
              <Field
                label="Nombre d'enfants à charge"
                hint="Mineurs ou < 25 ans en formation"
              >
                <NumInput value={enfants} onChange={setEnfants} />
              </Field>
            </>
          )}

          {/* ─── STEP 2: Revenus ─── */}
          {currentStep === "revenus" && (
            <>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  color: "#1a1a2e",
                }}
              >
                2. Revenus & cotisations sociales
              </h2>
              <div
                style={{
                  background: "#f0f4ff",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 12,
                  color: "#4a5280",
                }}
              >
                Reportez les montants de votre certificat de salaire annuel.
              </div>
              <Field
                label="Salaire brut annuel (CHF)"
                hint="Certificat de salaire, chiffre 1 ou 7"
              >
                <NumInput
                  value={salaireBrut}
                  onChange={setSalaireBrut}
                  suffix="CHF"
                />
              </Field>
              {statut === "marie" && (
                <Field
                  label="Salaire brut conjoint (CHF)"
                  hint="Si le conjoint travaille aussi"
                >
                  <NumInput
                    value={salaireConjoint}
                    onChange={setSalaireConjoint}
                    suffix="CHF"
                  />
                </Field>
              )}
              <Field
                label="Autres revenus (CHF)"
                hint="Indemnités, bonus, revenus locatifs, etc."
              >
                <NumInput
                  value={autresRevenus}
                  onChange={setAutresRevenus}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Revenus mobiliers (CHF)"
                hint="Intérêts, dividendes (avant impôt anticipé)"
              >
                <NumInput
                  value={revenusMobiliers}
                  onChange={setRevenusMobiliers}
                  suffix="CHF"
                />
              </Field>

              <div
                style={{
                  borderTop: "1px solid #e5e7ef",
                  marginTop: 20,
                  paddingTop: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 12,
                    color: "#1a1a2e",
                  }}
                >
                  Cotisations sociales (employé)
                </div>
                <div
                  style={{
                    background: "#f0f4ff",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 12,
                    color: "#4a5280",
                  }}
                >
                  Certificat de salaire chiffres 9 à 11. Si inconnu : AVS ~5.3%,
                  LPP variable (~7-10% du salaire coordonné), AC ~1.1%.
                </div>
              </div>
              <Field label="AVS/AI/APG (CHF)">
                <NumInput
                  value={cotisAVS}
                  onChange={setCotisAVS}
                  suffix="CHF"
                />
              </Field>
              <Field label="LPP — 2ᵉ pilier (CHF)">
                <NumInput
                  value={cotisLPP}
                  onChange={setCotisLPP}
                  suffix="CHF"
                />
              </Field>
              <Field label="Assurance-chômage AC (CHF)">
                <NumInput value={cotisAC} onChange={setCotisAC} suffix="CHF" />
              </Field>
            </>
          )}

          {/* ─── STEP 3: Déductions ─── */}
          {currentStep === "deductions" && (
            <>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "#1a1a2e",
                }}
              >
                3. Déductions TOU
              </h2>
              <p style={{ fontSize: 12, color: "#7a7f99", margin: "0 0 16px" }}>
                C'est ici que réside l'optimisation fiscale — chaque franc
                déduit réduit votre revenu imposable.
              </p>

              <div
                style={{
                  background: "#eef7ee",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 12,
                  color: "#2d5a3d",
                  fontWeight: 500,
                }}
              >
                🎯 Postes à fort impact : 3ᵉ pilier A, rachat LPP, primes
                maladie
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#4a5280",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Prévoyance
              </div>
              <Field
                label="Pilier 3a — versé en 2025 (CHF)"
                hint={`Max. déductible : ${fmt(7258)} CHF (salarié avec LPP)`}
              >
                <NumInput
                  value={pilier3a}
                  onChange={setPilier3a}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Pilier 3b — versé en 2025 (CHF)"
                hint={`Genève uniquement. Max ICC : ${fmt(statut === "marie" ? 4854 + enfants * 1618 : 2427 + enfants * 1618)} CHF pour votre situation`}
              >
                <NumInput
                  value={pilier3b}
                  onChange={setPilier3b}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Rachat 2ᵉ pilier LPP (CHF)"
                hint="Demandez l'attestation de lacune à votre caisse de pension"
              >
                <NumInput
                  value={rachat2e}
                  onChange={setRachat2e}
                  suffix="CHF"
                />
              </Field>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#4a5280",
                  margin: "20px 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Frais professionnels
              </div>
              <Field
                label="Frais de transport (CHF)"
                hint="Abonnement TPG/CFF ou 0.70 CHF/km voiture (plafond ~500 CHF/mois)"
              >
                <NumInput
                  value={fraisTransport}
                  onChange={setFraisTransport}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Frais de repas hors domicile (CHF)"
                hint="Forfait : 15 CHF/jour travaillé ≈ 3'200 CHF/an"
              >
                <NumInput
                  value={fraisRepas}
                  onChange={setFraisRepas}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Frais de formation continue (CHF)"
                hint="Certifications, cours, conférences — max ~12'000 CHF ICC"
              >
                <NumInput
                  value={fraisFormation}
                  onChange={setFraisFormation}
                  suffix="CHF"
                />
              </Field>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#4a5280",
                  margin: "20px 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Assurances & charges
              </div>
              <Field
                label="Primes assurance maladie LAMal + LCA (CHF)"
                hint="Montant annuel total payé (base + complémentaires)"
              >
                <NumInput
                  value={primesMaladie}
                  onChange={setPrimesMaladie}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Intérêts de dettes (CHF)"
                hint="Crédits conso, hypothèque, etc."
              >
                <NumInput
                  value={interetsDettes}
                  onChange={setInteretsDettes}
                  suffix="CHF"
                />
              </Field>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#4a5280",
                  margin: "20px 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Famille & autres
              </div>
              <Field
                label="Frais de garde d'enfants (CHF)"
                hint="Max ~25'000 CHF/enfant"
              >
                <NumInput
                  value={fraisGarde}
                  onChange={setFraisGarde}
                  suffix="CHF"
                />
              </Field>
              <Field label="Pensions alimentaires versées (CHF)">
                <NumInput
                  value={pensionAlim}
                  onChange={setPensionAlim}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Dons (CHF)"
                hint="Organismes d'utilité publique reconnus"
              >
                <NumInput value={dons} onChange={setDons} suffix="CHF" />
              </Field>
              <Field
                label="Frais médicaux non remboursés (CHF)"
                hint="Seulement la part > 5% du revenu net"
              >
                <NumInput
                  value={fraisMedicaux}
                  onChange={setFraisMedicaux}
                  suffix="CHF"
                />
              </Field>
              <Field
                label="Autres déductions (CHF)"
                hint="Cotisations syndicales, dons politiques, etc."
              >
                <NumInput
                  value={autresDeductions}
                  onChange={setAutresDeductions}
                  suffix="CHF"
                />
              </Field>
            </>
          )}

          {/* ─── STEP 4: Impôt source ─── */}
          {currentStep === "source" && (
            <>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  color: "#1a1a2e",
                }}
              >
                4. Impôt à la source déjà prélevé
              </h2>
              <div
                style={{
                  background: "#f0f4ff",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 12,
                  color: "#4a5280",
                }}
              >
                Additionnez les montants prélevés chaque mois sur vos fiches de
                salaire 2025, ou reportez le total du certificat de salaire
                (chiffre 12).
              </div>
              <Field
                label="Total impôt à la source 2025 (CHF)"
                hint="Somme des 12 mois ou certificat de salaire"
              >
                <NumInput
                  value={impotSourceAnnuel}
                  onChange={setImpotSourceAnnuel}
                  suffix="CHF"
                />
              </Field>
            </>
          )}

          {/* ─── STEP 5: Résultats ─── */}
          {currentStep === "resultats" && (
            <>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  color: "#1a1a2e",
                }}
              >
                5. Résultats de la simulation
              </h2>

              {/* Revenus */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Revenus
                </div>
                <Row label="Revenu brut total" value={results.totalBrut} />
                <Row
                  label="– Cotisations sociales"
                  value={-results.cotisationsSociales}
                  neg
                />
                <Row label="= Revenu net" value={results.revenuNet} bold />
              </div>

              {/* Déductions */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Déductions TOU
                </div>
                <Row
                  label="Total déductions ICC"
                  value={results.totalDeductionsICC}
                />
                <Row
                  label="Total déductions IFD"
                  value={results.totalDeductionsIFD}
                />
                <Row
                  label="= Revenu imposable ICC"
                  value={results.revenuImposableICC}
                  bold
                />
                <Row
                  label="= Revenu imposable IFD"
                  value={results.revenuImposableIFD}
                  bold
                />
              </div>

              {/* ICC détail */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  ICC — Détail du calcul
                </div>
                <Row label="Impôt de base ICC" value={results.iccBase} />
                <Row
                  label="+ Centimes add. cantonaux (47.5%)"
                  value={results.centimesCantonaux}
                />
                <Row
                  label="– Diminution d'impôt (12%)"
                  value={-results.diminution12}
                  neg
                />
                <Row
                  label="+ Aide à domicile (1%)"
                  value={results.aideDomicile}
                />
                <Row
                  label={`+ Centimes comm. ${commune} (${(results.communeRate * 100).toFixed(1)}%)`}
                  value={results.centimesCommunaux}
                />
                <Row label="= Total ICC" value={results.iccTotal} bold />
              </div>

              {/* IFD */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  IFD — Impôt fédéral direct
                </div>
                <Row label="Total IFD" value={results.ifdTotal} bold />
              </div>

              {/* Total & comparaison */}
              <div
                style={{
                  background: results.difference >= 0 ? "#eef7ee" : "#fff0f0",
                  borderRadius: 10,
                  padding: "16px",
                  marginTop: 8,
                }}
              >
                <Row label="Taxe personnelle" value={results.taxePerso} />
                <div
                  style={{
                    borderTop: "2px solid",
                    borderColor:
                      results.difference >= 0 ? "#b8e0b8" : "#e8b8b8",
                    margin: "10px 0",
                    paddingTop: 10,
                  }}
                >
                  <Row
                    label="TOTAL IMPÔT TOU"
                    value={results.impotTotalTOU}
                    bold
                    big
                  />
                  <Row
                    label="Impôt source prélevé"
                    value={results.impotSourceAnnuel}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 12,
                      padding: "12px 0 0",
                      borderTop: `2px dashed ${results.difference >= 0 ? "#5ecc7b" : "#e05555"}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1a1a2e",
                      }}
                    >
                      {results.difference >= 0
                        ? "💰 REMBOURSEMENT ESTIMÉ"
                        : "⚠️ COMPLÉMENT À PAYER"}
                    </span>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: results.difference >= 0 ? "#1a8a3a" : "#c03030",
                      }}
                    >
                      {results.difference >= 0 ? "+" : ""}
                      {fmt(results.difference)} CHF
                    </span>
                  </div>
                </div>
              </div>

              {/* Taux effectif */}
              <div
                style={{
                  marginTop: 16,
                  background: "#f5f6fa",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Taux effectifs
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    textAlign: "center",
                  }}
                >
                  <MiniStat
                    label="ICC"
                    value={
                      results.revenuImposableICC > 0
                        ? `${fmtD((results.iccTotal / results.revenuImposableICC) * 100)}%`
                        : "—"
                    }
                  />
                  <MiniStat
                    label="IFD"
                    value={
                      results.revenuImposableIFD > 0
                        ? `${fmtD((results.ifdTotal / results.revenuImposableIFD) * 100)}%`
                        : "—"
                    }
                  />
                  <MiniStat
                    label="Total / Brut"
                    value={
                      results.totalBrut > 0
                        ? `${fmtD((results.impotTotalTOU / results.totalBrut) * 100)}%`
                        : "—"
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  color: "#999",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ Estimation indicative basée sur les barèmes ICC 2025
                officiels (ge.ch) et les barèmes IFD 2025. Les déductions prises
                en compte dans le barème à la source (forfait repas, transport,
                assurance maladie) sont déjà intégrées dans l'impôt prélevé. Ce
                simulateur calcule l'impôt TOU global — la comparaison avec
                l'impôt source donne l'écart estimé. Consultez un fiscaliste
                pour validation. Délai TOU : 31 mars 2026.
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            gap: 12,
          }}
        >
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1,
                padding: "13px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                background: "transparent",
                color: "#8891b0",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Précédent
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                flex: 1,
                padding: "13px",
                border: "none",
                borderRadius: 8,
                background: "linear-gradient(135deg, #4a7cff, #6b8fff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(74,124,255,0.3)",
              }}
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, neg, big }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        fontSize: big ? 15 : 13,
        fontWeight: bold ? 700 : 400,
        color: neg ? "#b04040" : "#1a1a2e",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: big ? 16 : 13,
        }}
      >
        {neg && value < 0 ? "–" : ""}
        {fmt(Math.abs(value))} CHF
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#7a7f99", marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#1a1a2e",
        }}
      >
        {value}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
