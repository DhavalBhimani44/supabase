import { metadata as mainMetadata } from '@/app/layout'
import { FrameworkSelector } from '@/components/framework-selector'
import { Mdx } from '@/components/mdx-components'
import { SourcePanel } from '@/components/source-panel'
import { DashboardTableOfContents } from '@/components/toc'
import { getTableOfContents } from '@/lib/toc'
import { absoluteUrl, cn } from '@/lib/utils'
import '@/styles/code-block-variables.css'
import '@/styles/mdx.css'
import { allDocs } from 'contentlayer/generated'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Balancer from 'react-wrap-balancer'
import { ScrollArea } from 'ui'

interface DocPageProps {
  params: Promise<{
    slug: string[]
  }>
}

async function getDocFromParams({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || ''
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)

  if (!doc) {
    return null
  }

  return doc
}

export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  const params = await props.params
  const doc = await getDocFromParams({ params })

  if (!doc) {
    return {}
  }

  const metadata: Metadata = {
    ...mainMetadata,
    title: doc.title,
    description: doc.description,
    openGraph: {
      ...mainMetadata.openGraph,
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
    },
  }
  return metadata
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams.split('/'),
  }))
}

export default async function DocPage(props: DocPageProps) {
  const params = await props.params
  const doc = await getDocFromParams({ params })

  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.body.raw)

  return (
    <main className="relative lg:gap-10 xl:grid xl:grid-cols-[1fr_200px] px-8 md:px-16 py-20">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-4 flex items-center space-x-1 text-sm text-foreground-muted">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">Docs</div>
          <ChevronRight className="h-4 w-4 text-foreground-muted" />
          <div className="text-foreground-lighter">{doc.title}</div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-5">
          <div className="space-y-2">
            <h1 className={cn('scroll-m-20 text-2xl lg:text-4xl tracking-tight')}>{doc.title}</h1>
            {doc.description && (
              <p className="text-base lg:text-lg text-foreground-light">
                <Balancer>{doc.description}</Balancer>
              </p>
            )}
          </div>
          <FrameworkSelector />
        </div>
        <SourcePanel doc={doc} />
        <div className="pb-12">
          <Mdx code={doc.body.code} />
        </div>
      </div>
      {doc.toc && (
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4">
            <ScrollArea className="pb-10">
              <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] py-12">
                <DashboardTableOfContents toc={toc} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </main>
  )
}
