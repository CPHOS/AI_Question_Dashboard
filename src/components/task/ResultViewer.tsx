import { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Empty, Space, Tabs, Typography } from 'antd';
import { CopyOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ArtifactInfo, TaskResult } from '@/api/types';
import { compileTask, downloadArtifact } from '@/api/tasks';
import { downloadBlob } from '@/utils/download';
import { extractErrorMessage } from '@/api/client';
import { useThemeMode } from '@/theme/ThemeContext';
import ArtifactList from './ArtifactList';
import KatexScratchpad from './KatexScratchpad';

interface Props {
  taskId: string;
  result?: TaskResult;
  artifacts: ArtifactInfo[];
  artifactsLoading?: boolean;
}

export default function ResultViewer({ taskId, result, artifacts, artifactsLoading }: Props) {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const hasPdf = useMemo(() => artifacts.some((a) => a.name === 'final_pdf'), [artifacts]);
  const canCompile = useMemo(
    () => !!result?.final_latex || artifacts.some((a) => a.name === 'final_latex'),
    [result?.final_latex, artifacts],
  );

  const compileMutation = useMutation({
    mutationFn: () => compileTask(taskId),
    onSuccess: (res) => {
      message[res.final_pdf_available ? 'success' : 'warning'](
        res.final_pdf_available ? t('result.compileOk') : t('result.compileNoPdf'),
      );
      queryClient.invalidateQueries({ queryKey: ['task-artifacts', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-result', taskId] });
    },
    onError: (e) => message.error(extractErrorMessage(e)),
  });

  useEffect(() => {
    let revoked: string | null = null;
    let active = true;
    if (hasPdf) {
      setPdfLoading(true);
      downloadArtifact(taskId, 'final_pdf')
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          revoked = url;
          setPdfUrl(url);
        })
        .catch((e) => message.error(extractErrorMessage(e)))
        .finally(() => active && setPdfLoading(false));
    }
    return () => {
      active = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, hasPdf]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    message.success(t('common.copied'));
  };

  const downloadTex = () => {
    if (!result?.final_latex) return;
    downloadBlob(new Blob([result.final_latex], { type: 'text/x-tex' }), `${taskId}_final.tex`);
  };

  const codeStyle = mode === 'dark' ? oneDark : oneLight;

  const tabs = [
    {
      key: 'latex',
      label: t('result.finalLatex'),
      children: result?.final_latex ? (
        <div>
          <Space style={{ marginBottom: 8 }}>
            <Button icon={<CopyOutlined />} size="small" onClick={() => copy(result.final_latex!)}>
              {t('common.copy')}
            </Button>
            <Button icon={<DownloadOutlined />} size="small" onClick={downloadTex}>
              {t('common.download')} .tex
            </Button>
          </Space>
          <div className="cphos-latex-block" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <SyntaxHighlighter language="latex" style={codeStyle} wrapLongLines>
              {result.final_latex}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <Empty description={t('result.notReady')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    },
    {
      key: 'pdf',
      label: t('result.pdfPreview'),
      children: (
        <div>
          {canCompile && (
            <Space style={{ marginBottom: 8 }}>
              <Button
                icon={<SyncOutlined />}
                size="small"
                loading={compileMutation.isPending}
                onClick={() => compileMutation.mutate()}
              >
                {hasPdf ? t('result.recompile') : t('result.compile')}
              </Button>
            </Space>
          )}
          {hasPdf ? (
            pdfUrl ? (
              <iframe className="cphos-pdf-frame" src={pdfUrl} title="final_pdf" />
            ) : (
              <Typography.Text type="secondary">
                {pdfLoading ? t('common.loading') : t('result.noPdf')}
              </Typography.Text>
            )
          ) : (
            <Empty
              description={compileMutation.isPending ? t('result.compiling') : t('result.noPdf')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
    {
      key: 'report',
      label: t('result.report'),
      children: result?.report ? (
        <div>
          <Space style={{ marginBottom: 8 }}>
            <Button icon={<CopyOutlined />} size="small" onClick={() => copy(result.report!)}>
              {t('common.copy')}
            </Button>
          </Space>
          <Typography>
            <Markdown>{result.report}</Markdown>
          </Typography>
        </div>
      ) : (
        <Empty description={t('result.notReady')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    },
    {
      key: 'katex',
      label: 'KaTeX',
      children: <KatexScratchpad />,
    },
    {
      key: 'artifacts',
      label: t('result.downloadAll'),
      children: <ArtifactList taskId={taskId} artifacts={artifacts} loading={artifactsLoading} />,
    },
  ];

  return <Tabs items={tabs} />;
}
