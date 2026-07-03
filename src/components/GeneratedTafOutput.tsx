interface GeneratedTafOutputProps {
  text: string;
  station: string;
  validityFrom: string;
  validityTo: string;
  changeCount: number;
}

const keywordPattern = /^(TAF|TEMPO|BECMG|FM\d{6})$/;
const accentPattern = /^(\d{3}(\d{2}|P\d{2})(G\d{2})?KT|\d{4}|FEW\d{3}|SCT\d{3}|BKN\d{3}|OVC\d{3}|VV\d{3}|RA|DZ|SN|SH|TS|BR|FG|HZ)$/;

function tokenClass(token: string, station: string): string | undefined {
  if (keywordPattern.test(token)) return "taf-code-keyword";
  if (token === station || accentPattern.test(token)) return "taf-code-accent";
  return undefined;
}

export default function GeneratedTafOutput({
  text,
  station,
  validityFrom,
  validityTo,
  changeCount,
}: Readonly<GeneratedTafOutputProps>) {
  return (
    <>
      <pre data-testid="generated-taf" className="taf-code">
        {text.split(/(\s+)/).map((token, index) => (
          <span key={`${index}-${token}`} className={tokenClass(token, station)}>{token}</span>
        ))}
      </pre>
      <dl className="taf-output-meta">
        <div><dt>STATION</dt><dd>{station || "—"}</dd></div>
        <div><dt>VALIDITY</dt><dd>{validityFrom}Z–{validityTo}Z</dd></div>
        <div><dt>BASE</dt><dd>Configured</dd></div>
        <div><dt>CHANGES</dt><dd>{changeCount} {changeCount === 1 ? "block" : "blocks"}</dd></div>
      </dl>
      <p className="taf-output-note">The generated message remains visible while editing, reducing context switching and making cause-and-effect easier to verify.</p>
    </>
  );
}
