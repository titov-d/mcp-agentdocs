import { CopyButton } from "@/components/CopyButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Faq, type QA } from "@/components/Faq";
import { getFreshness, formatDate } from "@/lib/data";

export const revalidate = 3600;

const REPO_URL = "https://github.com/titov-d/mcp-agentdocs";
const GITHUB_PROFILE = "https://github.com/titov-d";
const NPM_URL = "https://www.npmjs.com/package/mcp-agentdocs";
const INSTALL_CMD = "claude mcp add agentdocs -- npx -y mcp-agentdocs@latest";
const CLIENT_JSON = `{
  "mcpServers": {
    "agentdocs": {
      "command": "npx",
      "args": ["-y", "mcp-agentdocs@latest"]
    }
  }
}`;

const TOOLS = [
  { name: "list_topics", desc: "Browse the topics available in the corpus before you search." },
  { name: "search_docs", desc: "Keyword search across the corpus, filterable by topic." },
  { name: "get_doc", desc: "Fetch a full document with its source URL and verification date." },
];

const FAQ: QA[] = [
  {
    q: "What is the Model Context Protocol (MCP)?",
    a: "An open standard for connecting AI assistants to external tools and data. An MCP server exposes tools the assistant can call.",
  },
  { q: "Is agentdocs free?", a: "Yes. Open source, no account, no billing." },
  {
    q: "Does it send my code anywhere?",
    a: "No. It runs locally on your machine over stdio and only serves bundled documentation. It does not read your project or make network calls while answering.",
  },
  {
    q: "How fresh are the docs?",
    a: "Every document shows its last-verified date. The corpus is re-checked against upstream sources on a regular cadence, and updates ship as new package releases.",
  },
  {
    q: "How are docs verified?",
    a: "Claim by claim against the primary source, with a logged verification record, before a doc is marked verified.",
  },
  {
    q: "Which docs are covered today?",
    a: "The MCP specification (transports, tools, resources, prompts, lifecycle, authorization) and the Claude API MCP connector. The corpus is expanding.",
  },
  {
    q: "Which clients work?",
    a: "Any MCP client — Claude Code, Cursor, Claude Desktop, and others.",
  },
];

const SECTION = "mx-auto max-w-[1120px] px-6 py-[clamp(64px,9vw,112px)]";
const KICKER = "font-mono text-xs font-medium uppercase tracking-[0.14em]";
const H2 = "mt-4 font-serif text-[clamp(30px,4.4vw,46px)] font-semibold leading-[1.08] tracking-tight";

export default async function Page() {
  const data = await getFreshness();
  const verifiedLong = formatDate(data.lastVerified);
  const changelogRows = data.changelog.flatMap((e) => e.items.map((text) => ({ date: e.date, text }))).slice(0, 5);

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* header */}
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg) 84%, transparent)" }}>
        <nav className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-3">
          <a href="#top" className="inline-flex items-center gap-2.5 font-mono text-[15px] font-semibold tracking-tight text-fg no-underline">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
            agentdocs
          </a>
          <div className="flex flex-wrap items-center gap-[22px] text-sm">
            <a href="#how" className="text-fg-soft no-underline hover:text-fg">How it works</a>
            <a href="#freshness" className="text-fg-soft no-underline hover:text-fg">Freshness</a>
            <a href="#faq" className="text-fg-soft no-underline hover:text-fg">FAQ</a>
            <a href={REPO_URL} className="text-fg-soft no-underline hover:text-fg">GitHub</a>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="top">
        {/* hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(var(--grid) 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(180deg,#000 0%,#000 55%,transparent 95%)", WebkitMaskImage: "linear-gradient(180deg,#000 0%,#000 55%,transparent 95%)" }} />
          <div className="relative mx-auto grid max-w-[1120px] items-center gap-[clamp(36px,5vw,68px)] px-6 py-[clamp(52px,8vw,108px)] [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
            <div>
              <div className={`${KICKER} text-accent`}>Local MCP server · npm</div>
              <h1 className="mt-5 font-serif text-[clamp(46px,7.4vw,78px)] font-semibold leading-[0.97] tracking-tight">agentdocs</h1>
              <p className="mt-5 max-w-[32ch] text-[clamp(17px,2.1vw,21px)] leading-snug text-fg-soft">
                Fresh, source-verified docs for building MCP servers and Claude agents — delivered straight to your AI coding assistant.
              </p>
              <div className="mt-8 flex max-w-[580px] items-center gap-3 rounded-xl border border-border bg-bg-code py-1.5 pl-[18px] pr-1.5">
                <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[clamp(12px,1.55vw,14.5px)] text-fg">
                  <span className="text-accent">$ </span>{INSTALL_CMD}
                </code>
                <CopyButton text={INSTALL_CMD} variant="solid" />
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-[18px]">
                <span className="font-mono text-[12.5px] text-fg-mute">Local · Free · No account.</span>
                <a href="#what" className="border-b border-border text-sm text-fg-soft no-underline hover:border-accent hover:text-accent">What is this? →</a>
              </div>
            </div>

            {/* assistant panel — real verification date + real source host */}
            <div className="overflow-hidden rounded-2xl border border-border bg-bg-soft shadow-[0_18px_50px_-24px_rgba(0,0,0,0.32)]">
              <div className="flex items-center gap-2 border-b border-border-soft px-4 py-3" style={{ background: "color-mix(in srgb, var(--fg) 3%, transparent)" }}>
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-2 font-mono text-[11.5px] text-fg-mute">assistant ⇄ agentdocs</span>
              </div>
              <div className="px-5 py-[18px] font-mono text-[13px] leading-[1.85] text-fg-soft">
                <div><span className="text-fg-mute">you ›</span> <span className="text-fg">How does MCP authorization work in the latest spec?</span></div>
                <div className="mt-3.5 text-fg-mute">assistant › querying <span className="text-accent">agentdocs</span></div>
                <div className="mt-1 text-fg-mute">&nbsp;&nbsp;<span className="text-fg-soft">get_doc(&quot;mcp-authorization&quot;)</span></div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent-soft px-2.5 py-2 text-fg">
                  <span className="dot-pulse inline-block h-[7px] w-[7px] rounded-full bg-accent" />
                  verified {data.lastVerified ?? "—"} · modelcontextprotocol.io
                </div>
                <div className="mt-3.5 text-fg-soft">answering from current, cited material — no guessing.</div>
              </div>
            </div>
          </div>
        </section>

        {/* what */}
        <section id="what" className="border-b border-border">
          <div className={SECTION}>
            <div className={`${KICKER} text-fg-mute`}>01 — What it is</div>
            <h2 className={`${H2} max-w-[18ch]`}>Your assistant is confident about things that changed last month.</h2>
            <div className="mt-7 max-w-[680px] text-[clamp(16.5px,1.9vw,18.5px)] leading-relaxed text-fg-soft">
              <p>AI coding assistants are trained up to a fixed date, so they confidently give outdated or wrong answers about fast-moving tools like the Model Context Protocol — whose specification ships breaking revisions every few months.</p>
              <p className="mt-[18px]"><strong className="font-semibold text-fg">agentdocs</strong> is a local MCP server that gives your assistant a small, hand-curated corpus of current, source-verified documentation about building MCP servers and Claude agents.</p>
            </div>
            <div className="mt-[30px] flex max-w-[680px] items-start gap-3 rounded-xl border border-border bg-accent-soft px-5 py-[18px]">
              <span className="mt-[3px] inline-block h-2 w-2 flex-none rounded-sm bg-accent" />
              <span className="text-base leading-snug text-fg">Every document records the source URL and the date it was last verified against that source.</span>
            </div>
          </div>
        </section>

        {/* how */}
        <section id="how" className="border-b border-border" style={{ background: "color-mix(in srgb, var(--fg) 1.5%, var(--bg))" }}>
          <div className={SECTION}>
            <div className={`${KICKER} text-fg-mute`}>02 — How it works</div>
            <h2 className={H2}>Three tools, served over stdio.</h2>
            <div className="mt-11 grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(248px,1fr))]">
              {TOOLS.map((t, i) => (
                <div key={t.name} className="rounded-2xl border border-border bg-bg-soft px-[22px] pb-[26px] pt-6">
                  <div className="font-mono text-[11px] text-fg-mute">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-3.5 inline-block rounded-md bg-accent-soft px-2.5 py-[5px] font-mono text-[15px] font-semibold text-accent">{t.name}</div>
                  <p className="mt-4 text-[15.5px] leading-snug text-fg-soft">{t.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-[720px] text-[16.5px] leading-relaxed text-fg-soft">
              agentdocs runs locally over stdio. When you ask your assistant something it would otherwise guess at, it queries agentdocs and answers from fresh, cited material.
            </p>
          </div>
        </section>

        {/* freshness — real data */}
        <section id="freshness" className="border-b border-border">
          <div className={SECTION}>
            <div className={`${KICKER} text-accent`}>03 — Freshness</div>
            <h2 className={`${H2} max-w-[20ch]`}>Verified by hand, stamped with a date.</h2>
            <div className="mt-10 grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
              <div className="rounded-2xl border border-border bg-bg-soft px-7 py-[30px]">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-accent bg-accent-soft px-[15px] py-2.5">
                  <span className="dot-pulse inline-block h-2 w-2 rounded-full bg-accent" />
                  <span className="font-mono text-[13px] font-semibold text-fg">docs verified on {verifiedLong}</span>
                </div>
                <p className="mt-[22px] text-[16.5px] leading-relaxed text-fg-soft">
                  Docs are verified by hand against their primary sources — the MCP specification and Anthropic&apos;s platform docs — and stamped with a verification date. When sources change upstream, the affected docs are re-verified.
                </p>
                <p className="mt-4 font-mono text-[12.5px] text-fg-mute">
                  {data.docCount} docs · {data.topics.length} topic{data.topics.length === 1 ? "" : "s"} · published to npm
                </p>
                <a href={`${REPO_URL}/blob/main/CHANGELOG.md`} className="mt-[22px] inline-flex items-center gap-2 border-b border-accent pb-0.5 font-mono text-[13.5px] font-semibold text-accent no-underline">
                  See the changelog →
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-bg-code px-[26px] pb-[22px] pt-[26px]">
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg-mute">Recent verifications</div>
                <div className="mt-[18px] flex flex-col">
                  {changelogRows.length === 0 ? (
                    <div className="py-3 text-[14.5px] text-fg-soft">Changelog will appear here.</div>
                  ) : (
                    changelogRows.map((row, i) => (
                      <div key={i} className={`flex gap-4 py-[13px] ${i < changelogRows.length - 1 ? "border-b border-border" : ""}`}>
                        <span className="w-[90px] flex-none font-mono text-[12.5px] text-accent">{row.date}</span>
                        <span className="text-[14.5px] leading-snug text-fg-soft">{row.text.replace(/[*`]/g, "")}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* install */}
        <section id="install" className="border-b border-border" style={{ background: "color-mix(in srgb, var(--fg) 1.5%, var(--bg))" }}>
          <div className={SECTION}>
            <div className={`${KICKER} text-fg-mute`}>04 — Install</div>
            <h2 className={H2}>Add it to your client.</h2>
            <p className="mt-4 font-mono text-base text-fg-mute">Works with any MCP client.</p>
            <div className="mt-10 flex max-w-[840px] flex-col gap-5">
              <InstallCard title="Claude Code" code={INSTALL_CMD} prompt="$ " />
              <InstallCard title="Cursor" hint="mcp.json" code={CLIENT_JSON} />
              <InstallCard title="Claude Desktop" hint="config file" code={CLIENT_JSON} note="Add to your claude_desktop_config.json, then restart Claude Desktop." />
            </div>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="border-b border-border">
          <div className="mx-auto max-w-[840px] px-6 py-[clamp(64px,9vw,112px)]">
            <div className={`${KICKER} text-fg-mute`}>05 — FAQ</div>
            <h2 className={`${H2} mb-9`}>Questions before you install.</h2>
            <Faq items={FAQ} />
          </div>
        </section>

        {/* cta */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(var(--grid) 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(180deg,transparent,#000 70%)", WebkitMaskImage: "linear-gradient(180deg,transparent,#000 70%)" }} />
          <div className="relative mx-auto max-w-[840px] px-6 py-[clamp(64px,9vw,104px)] text-center">
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-semibold leading-tight tracking-tight">Stop guessing. Start citing.</h2>
            <div className="mx-auto mt-7 flex max-w-[560px] items-center gap-3 rounded-xl border border-border bg-bg-code py-1.5 pl-[18px] pr-1.5">
              <code className="flex-1 overflow-x-auto whitespace-nowrap text-left font-mono text-[clamp(12px,1.55vw,14.5px)] text-fg">
                <span className="text-accent">$ </span>{INSTALL_CMD}
              </code>
              <CopyButton text={INSTALL_CMD} variant="solid" />
            </div>
            <div className="mt-3.5 font-mono text-[12.5px] text-fg-mute">Local · Free · No account.</div>
          </div>
        </section>

        {/* footer */}
        <footer className="border-t border-border" style={{ background: "color-mix(in srgb, var(--fg) 1.5%, var(--bg))" }}>
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-7 px-6 py-12">
            <div>
              <a href="#top" className="inline-flex items-center gap-2.5 font-mono text-[15px] font-semibold text-fg no-underline">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
                agentdocs
              </a>
              <p className="mt-3.5 text-[14.5px] text-fg-soft">Built by <a href={GITHUB_PROFILE} className="text-fg underline decoration-border underline-offset-2 transition hover:text-accent hover:decoration-accent">Dmitry Titov</a> — building software since 2010.</p>
            </div>
            <div className="flex items-center gap-6 font-mono text-[13.5px]">
              <a href={REPO_URL} className="text-fg-soft no-underline hover:text-accent">GitHub repo ↗</a>
              <a href={NPM_URL} className="text-fg-soft no-underline hover:text-accent">npm package ↗</a>
            </div>
          </div>
          <div className="border-t border-border-soft">
            <div className="mx-auto max-w-[1120px] px-6 py-[18px] font-mono text-[12.5px] text-fg-mute">© 2026 Dmitry Titov. Open source.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function InstallCard({ title, hint, code, prompt, note }: { title: string; hint?: string; code: string; prompt?: string; note?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-[18px] py-3.5">
        <span className="text-[14.5px] font-semibold text-fg">
          {title}
          {hint ? <span className="ml-1.5 font-mono text-[12.5px] font-normal text-fg-mute">{hint}</span> : null}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="m-0 overflow-x-auto p-[18px] font-mono text-[13.5px] leading-relaxed text-fg">
        {prompt ? <span className="text-accent">{prompt}</span> : null}
        {code}
      </pre>
      {note ? <div className="px-[18px] pb-4 text-[13px] text-fg-mute">{note}</div> : null}
    </div>
  );
}
