import type { GroupWithValues, FieldWithValue } from "@/lib/profile-fields";

function parseSet(v: string): string[] {
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function FieldValue({ field }: { field: FieldWithValue }) {
  const v = field.value;
  switch (field.type) {
    case "url":
      return <a href={v} className="link-inline" target="_blank" rel="noopener noreferrer nofollow">{v}</a>;
    case "yesno":
      return <span>{v === "1" ? "Sim" : "Não"}</span>;
    case "color":
      return (
        <span className="pf-display__color">
          <span className="pf-display__swatch" style={{ backgroundColor: v }} aria-hidden="true" />
          {v}
        </span>
      );
    case "checkboxset": {
      const items = parseSet(v);
      return <span>{items.join(", ")}</span>;
    }
    case "date": {
      const d = new Date(v);
      return <span>{Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(d)}</span>;
    }
    case "editor":
    case "textarea":
      return <span className="pf-display__multiline">{v}</span>;
    default:
      return <span>{v}</span>;
  }
}

export function ProfileFieldsDisplay({ groups }: { groups: GroupWithValues[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="profile-card">
      {groups.map((g) => (
        <section key={g.id} className="pf-display">
          <h2 className="profile-card__title">{g.name}</h2>
          <dl className="pf-display__list">
            {g.fields.map((f) => (
              <div key={f.id} className="pf-display__row">
                <dt className="pf-display__label">{f.name}</dt>
                <dd className="pf-display__value"><FieldValue field={f} /></dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
