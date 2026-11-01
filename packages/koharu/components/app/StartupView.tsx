'use client'

import { AlertCircle, LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { useMacOS, WindowControls } from '@/components/app/WindowChrome'
import { useKoharuStore } from '@/lib/store'

function formatRuntimeName(rawName: string | null): string {
  if (!rawName) return 'Runtime Component'
  const lower = rawName.toLowerCase()
  if (lower.includes('cublas')) return 'NVIDIA CUDA cuBLAS'
  if (lower.includes('cudnn')) return 'NVIDIA cuDNN'
  if (lower.includes('torch')) return 'PyTorch Runtime'
  if (lower.includes('llama')) return 'Llama Engine'
  if (lower.includes('diffusion')) return 'Diffusion Engine'
  if (lower.includes('cuda.tar.gz') || lower.includes('cuda.tar')) return 'CUDA Runtime'
  if (lower.includes('rocm')) return 'AMD ROCm Runtime'
  return rawName
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export function StartupView() {
  const { t } = useTranslation()
  const macOS = useMacOS()
  const downloads = useKoharuStore((state) => state.downloads)

  const runningDownloads = Object.values(downloads).filter((d) => d.state === 'running')
  const failedDownloads = Object.values(downloads).filter((d) => d.state === 'failed')

  const hasDownloads = runningDownloads.length > 0
  const hasFailure = !hasDownloads && failedDownloads.length > 0

  const totalCompleted = runningDownloads.reduce((sum, d) => sum + d.completed, 0)
  const totalBytes = runningDownloads.reduce((sum, d) => sum + d.total, 0)
  const hasKnownTotal = runningDownloads.length > 0 && runningDownloads.every((d) => d.total > 0)
  const percent =
    hasKnownTotal && totalBytes > 0
      ? Math.min(100, Math.round((totalCompleted / totalBytes) * 100))
      : null

  const primaryDownload = runningDownloads[0]
  const displayName =
    runningDownloads.length === 1
      ? formatRuntimeName(primaryDownload.name)
      : t('startup.downloadingCount', {
          count: runningDownloads.length,
          defaultValue: `Downloading ${runningDownloads.length} components`,
        })

  const rawFileName = runningDownloads.length === 1 ? primaryDownload.name : null
  const failedMessage =
    failedDownloads[0]?.error || t('startup.failed', { defaultValue: 'Failed to initialize runtimes' })

  return (
    <div className='relative flex h-screen w-screen flex-col overflow-hidden bg-[var(--surface-titlebar)] text-foreground'>
      <header
        data-tauri-drag-region='deep'
        className='grid h-10 shrink-0 grid-cols-[132px_1fr_132px] items-center border-b border-border/80 bg-[var(--surface-titlebar)] shadow-[var(--shadow-titlebar)]'
      >
        <div className='flex h-full items-center'>
          {!macOS && (
            <div className='grid h-full w-10 place-items-center rounded-br-lg'>
              <Image
                className='pointer-events-none rounded-[3px]'
                src='/icon.png'
                alt=''
                width={17}
                height={17}
                draggable={false}
                priority
              />
            </div>
          )}
        </div>
        <div className='grid h-full place-items-center text-[11px] text-muted-foreground select-none'>
          kore-minit
        </div>
        {!macOS && <WindowControls />}
      </header>

      <main className='relative grid min-h-0 flex-1 place-items-center overflow-hidden bg-[var(--surface-canvas)]'>
        <section
          className='w-full max-w-[620px] px-10 text-center'
          role='status'
          aria-live='polite'
          aria-labelledby='startup-title'
        >
          <LoaderCircle
            className='startup-spinner mx-auto size-11 text-primary'
            aria-hidden='true'
          />
          <h1
            id='startup-title'
            className='mt-5 text-[24px] font-semibold tracking-[-0.025em] text-balance'
          >
            {t('startup.title')}
          </h1>
          <p className='mx-auto mt-2 max-w-[48ch] text-[13px] leading-5 text-muted-foreground'>
            {t('startup.description')}
          </p>

          {hasDownloads ? (
            <div className='mx-auto mt-8 w-full max-w-[460px] rounded-xl border border-border/70 bg-card/60 p-4.5 text-left shadow-xs backdrop-blur-xs'>
              <div className='flex items-center justify-between gap-3 text-[12px]'>
                <div className='flex min-w-0 items-center gap-2'>
                  <span className='relative flex size-2'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
                    <span className='relative inline-flex size-2 rounded-full bg-primary' />
                  </span>
                  <span className='truncate font-medium text-foreground'>{displayName}</span>
                </div>
                <span className='shrink-0 font-mono text-[11px] font-semibold text-primary tabular-nums'>
                  {percent !== null ? `${percent}%` : null}
                </span>
              </div>

              <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/80'>
                <div
                  className={`h-full rounded-full bg-primary transition-all duration-200 ease-out ${
                    percent === null ? 'w-1/3 animate-pulse' : ''
                  }`}
                  style={percent !== null ? { width: `${percent}%` } : undefined}
                />
              </div>

              <div className='mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground'>
                <span className='max-w-[240px] truncate text-[10px] opacity-75'>
                  {rawFileName}
                </span>
                <span className='ml-2 shrink-0 font-mono text-[10px] tabular-nums'>
                  {totalBytes > 0
                    ? `${formatBytes(totalCompleted)} / ${formatBytes(totalBytes)}`
                    : formatBytes(totalCompleted)}
                </span>
              </div>
            </div>
          ) : hasFailure ? (
            <div className='mx-auto mt-7 flex max-w-[480px] items-center justify-center gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[12px] text-destructive'>
              <AlertCircle className='size-4 shrink-0' aria-hidden='true' />
              <span className='truncate'>{failedMessage}</span>
            </div>
          ) : (
            <div className='mx-auto mt-7 flex max-w-[480px] items-center justify-center gap-2.5 border-t border-border/80 pt-4 text-[12px] font-medium text-muted-foreground'>
              <span className='size-2 rounded-full bg-primary animate-pulse' aria-hidden='true' />
              {t('startup.status')}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
