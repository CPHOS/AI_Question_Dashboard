import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Tag, Typography } from 'antd';
import katex from 'katex';
import { useTranslation } from 'react-i18next';

/**
 * Renders the custom agent output format used across CPHOS phases.
 *
 * The agents emit a LaTeX-flavoured text that is NOT standard markdown:
 *  - `<block_math label="eq:x" score="N">…</block_math>` — display formula
 *    (also tolerates the `\end{block_math}` closing variant), optional score.
 *  - `$…$` — inline math (escaped `\$` ignored).
 *  - `<figure label="fig:x" caption="…">绘图说明</figure>` — figure placeholder.
 *  - `\ref{eq:label}` — cross reference; `\addtext{描述}{分值}` — text score point.
 *  - `(1)`, `(1.1)`, `A.` sub-question markers and `[X分]` score annotations.
 *
 * A self-contained tokenizer turns these into React nodes; math is rendered
 * with KaTeX (`throwOnError: false`). No markdown / remark dependency is used,
 * keeping the parse predictable for physics content. Light inline markdown
 * (`**bold**`) is supported for planning notes and review opinions.
 */

interface Props {
  text?: string | null;
  /** Visually compact variant (slightly smaller spacing/font). */
  compact?: boolean;
}

// --- block-level segments --------------------------------------------------

type Segment =
  | { type: 'prose'; text: string }
  | { type: 'block'; label: string; score?: string; tex: string }
  | { type: 'figure'; label: string; caption: string; body: string };

const BLOCK_RE =
  /<block_math\s+label="([^"]*)"(?:\s+score="(\d+)")?\s*>([\s\S]*?)(?:<\/block_math>|\\end\{block_math\})|<figure\s+label="([^"]*)"\s+caption="([^"]*)"\s*>([\s\S]*?)<\/figure>/g;

function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'prose', text: input.slice(last, m.index) });
    }
    if (m[1] !== undefined) {
      segments.push({ type: 'block', label: m[1], score: m[2], tex: (m[3] || '').trim() });
    } else {
      segments.push({
        type: 'figure',
        label: m[4] || '',
        caption: m[5] || '',
        body: (m[6] || '').trim(),
      });
    }
    last = BLOCK_RE.lastIndex;
  }
  if (last < input.length) {
    segments.push({ type: 'prose', text: input.slice(last) });
  }
  return segments;
}

// --- inline tokens ---------------------------------------------------------

// $…$ inline math | \ref{…} | \addtext{…}{N} | [N分] score | **bold**
const INLINE_RE =
  /(?<!\\)\$(.+?)(?<!\\)\$|\\ref\{([^}]*)\}|\\addtext\{((?:[^{}]|\{[^{}]*\})*)\}\{(\d+)\}|\[(\d+)\s*分\]|\*\*([^*]+)\*\*/g;

function renderMath(tex: string, displayMode: boolean): { __html: string } | null {
  try {
    return { __html: katex.renderToString(tex, { displayMode, throwOnError: false }) };
  } catch {
    return null;
  }
}

function InlineMath({ tex }: { tex: string }) {
  const html = renderMath(tex, false);
  if (!html) return <code>{tex}</code>;
  return <span dangerouslySetInnerHTML={html} />;
}

function inlineNodes(text: string, scoreLabel: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      nodes.push(<InlineMath key={key++} tex={m[1]} />);
    } else if (m[2] !== undefined) {
      nodes.push(
        <span key={key++} className="cphos-agent-ref">
          ({m[2]})
        </span>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <Tag key={key++} color="gold" bordered={false} style={{ margin: '0 2px' }}>
          {m[3]} · {m[4]}
          {scoreLabel}
        </Tag>,
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <Tag key={key++} color="blue" bordered={false} style={{ margin: '0 2px' }}>
          {m[5]}
          {scoreLabel}
        </Tag>,
      );
    } else if (m[6] !== undefined) {
      nodes.push(<strong key={key++}>{m[6]}</strong>);
    }
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return nodes;
}

// Leading sub-question marker, e.g. (1), (1.1), (1.1.1), A.
const LEAD_RE = /^(\s*)(\([\d.]+\)|[A-Z]\.)/;

function ProseLine({ line, scoreLabel }: { line: string; scoreLabel: string }) {
  const lead = LEAD_RE.exec(line);
  if (lead) {
    const rest = line.slice(lead[0].length);
    return (
      <>
        {lead[1]}
        <strong className="cphos-agent-lead">{lead[2]}</strong>
        {inlineNodes(rest, scoreLabel)}
      </>
    );
  }
  return <>{inlineNodes(line, scoreLabel)}</>;
}

function Prose({ text, scoreLabel }: { text: string; scoreLabel: string }) {
  // Preserve meaningful line breaks; collapse 3+ blank lines.
  const lines = text.replace(/\n{3,}/g, '\n\n').split('\n');
  return (
    <div className="cphos-agent-prose">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="cphos-agent-gap" />
        ) : (
          <div key={i} className="cphos-agent-line">
            <ProseLine line={line} scoreLabel={scoreLabel} />
          </div>
        ),
      )}
    </div>
  );
}

export default function AgentOutput({ text, compact }: Props) {
  const { t } = useTranslation();
  const scoreLabel = t('agentOutput.scoreSuffix', { defaultValue: '分' });
  const segments = useMemo(() => tokenize(text ?? ''), [text]);

  if (!text || !text.trim()) {
    return <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>;
  }

  return (
    <div className={compact ? 'cphos-agent cphos-agent-compact' : 'cphos-agent'}>
      {segments.map((seg, i) => {
        if (seg.type === 'prose') {
          return <Prose key={i} text={seg.text} scoreLabel={scoreLabel} />;
        }
        if (seg.type === 'block') {
          const html = renderMath(seg.tex, true);
          return (
            <div key={i} className="cphos-agent-block">
              {seg.score && (
                <Tag color="gold" bordered={false} className="cphos-agent-block-score">
                  {seg.score}
                  {scoreLabel}
                </Tag>
              )}
              {html ? (
                <div className="cphos-agent-block-math" dangerouslySetInnerHTML={html} />
              ) : (
                <pre className="cphos-agent-raw">{seg.tex}</pre>
              )}
            </div>
          );
        }
        // figure
        return (
          <div key={i} className="cphos-agent-figure">
            <div className="cphos-agent-figure-caption">
              {t('agentOutput.figure', { defaultValue: '图' })}
              {seg.caption ? ` · ${seg.caption}` : ''}
            </div>
            {seg.body && <div className="cphos-agent-figure-body">{seg.body}</div>}
          </div>
        );
      })}
    </div>
  );
}
