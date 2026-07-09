import { useLang, SUPPORTED_LANGS, LANG_LABEL, type Lang } from "./index";

export function LanguageToggle() {
  const [lang, setLang] = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {SUPPORTED_LANGS.map((l: Lang, i) => (
        <span key={l} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && <span className="lang-sep">·</span>}
          <button
            className={`lang-btn ${lang === l ? "active" : ""}`}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
          >
            {LANG_LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
