"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { label: string; sublabel: string; href: string };
type Results = {
  devices: { slug: string; name: string; manufacturer: string }[];
  articles: { slug: string; title: string; summary: string | null }[];
};

export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // busca ao vivo com debounce
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data: Results = await res.json();
        const opts: Option[] = [
          ...data.devices.map((d) => ({ label: d.name, sublabel: d.manufacturer, href: `/consoles/${d.slug}` })),
          ...data.articles.map((a) => ({ label: a.title, sublabel: a.summary ?? "Guia", href: `/guias/${a.slug}` })),
        ];
        setOptions(opts);
        setOpen(true);
        setActive(-1);
      } catch {
        /* abortado */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // fecha ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  function go(opt: Option) {
    setOpen(false);
    setValue("");
    router.push(opt.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active]);
      else if (value.trim()) {
        setOpen(false);
        router.push(`/buscar?q=${encodeURIComponent(value.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && value.trim().length >= 2;

  return (
    <div ref={boxRef} className={cn("search", className)}>
      <Search className="search__icon" aria-hidden="true" />
      <input
        type="text"
        role="combobox"
        aria-expanded={showPanel ? "true" : "false"}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Buscar consoles e guias"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => options.length && setOpen(true)}
        placeholder="Buscar consoles e guias…"
        className="search__input"
      />
      {showPanel && (
        <div id={listId} role="listbox" aria-label="Resultados" className="search__panel">
          {options.length === 0 ? (
            <p className="search__empty">{loading ? "Buscando…" : "Nada encontrado."}</p>
          ) : (
            options.map((opt, i) => (
              <div
                key={opt.href}
                role="option"
                aria-selected={i === active ? "true" : "false"}
                onMouseEnter={() => setActive(i)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  go(opt);
                }}
                className={cn("search__option", i === active && "search__option--active")}
              >
                <span>{opt.label}</span>
                <span className="search__option-sub">{opt.sublabel}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
