import { useEffect, useMemo, useState } from 'react';
import { Alert, Input, Typography } from 'antd';
import katex from 'katex';
import { useTranslation } from 'react-i18next';

/**
 * A small scratchpad that renders a LaTeX math snippet with KaTeX.
 * Full CPHOS documents can't render client-side, so this lets users
 * preview individual formulas pasted from the source.
 */
export default function KatexScratchpad({ initial = '' }: { initial?: string }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initial);

  useEffect(() => {
    if (initial) setInput(initial);
  }, [initial]);

  const html = useMemo(() => {
    try {
      return { ok: true, value: katex.renderToString(input || '', { displayMode: true, throwOnError: false }) };
    } catch (e) {
      return { ok: false, value: String(e) };
    }
  }, [input]);

  return (
    <div>
      <Input.TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder={'E = mc^2'}
        style={{ fontFamily: 'monospace', marginBottom: 12 }}
      />
      {!input && (
        <Typography.Text type="secondary">{t('phaseOutput.waiting')}</Typography.Text>
      )}
      {input && html.ok && (
        <div
          className="cphos-latex-block"
          dangerouslySetInnerHTML={{ __html: html.value }}
        />
      )}
      {input && !html.ok && <Alert type="error" message={html.value} />}
    </div>
  );
}
