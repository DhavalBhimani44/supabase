import { sep } from 'node:path'

import {
  GitHubDiscussionLoader,
  type GitHubDiscussionSource,
  fetchDiscussions,
} from './github-discussion.js'
import { LintWarningsGuideLoader, type LintWarningsGuideSource } from './lint-warnings-guide.js'
import { MarkdownLoader, type MarkdownSource } from './markdown.js'
import { IntegrationLoader, type IntegrationSource, fetchPartners } from './partner-integrations.js'
import {
  CliReferenceLoader,
  type CliReferenceSource,
  ClientLibReferenceLoader,
  type ClientLibReferenceSource,
  OpenApiReferenceLoader,
  type OpenApiReferenceSource,
} from './reference-doc.js'
import { walk } from './util.js'

const ignoredFiles = ['pages/404.mdx']

export type SearchSource =
  | MarkdownSource
  | OpenApiReferenceSource
  | ClientLibReferenceSource
  | CliReferenceSource
  | GitHubDiscussionSource
  | IntegrationSource
  | LintWarningsGuideSource

export async function fetchGuideSources() {
  return (
    await Promise.all(
      (await walk('content/guides'))
        .filter(
          ({ path }) =>
            /\.mdx?$/.test(path) &&
            !ignoredFiles.includes(path) &&
            !path.split(sep).some((part) => part.startsWith('_'))
        )
        .map((entry) => new MarkdownLoader('guide', entry.path, { yaml: true }).load())
    )
  ).flat()
}

export async function fetchOpenApiReferenceSource() {
  return new OpenApiReferenceLoader(
    'api',
    '/reference/api',
    { title: 'Management API Reference' },
    'spec/transforms/api_v1_openapi_deparsed.json',
    'spec/common-api-sections.json'
  ).load()
}

export async function fetchJsLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'js-lib',
    '/reference/javascript',
    { title: 'JavaScript Reference', language: 'JavaScript' },
    'spec/supabase_js_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchDartLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'dart-lib',
    '/reference/dart',
    { title: 'Dart Reference', language: 'Dart' },
    'spec/supabase_dart_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchPythonLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'python-lib',
    '/reference/python',
    { title: 'Python Reference', language: 'Python' },
    'spec/supabase_py_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchCSharpLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'csharp-lib',
    '/reference/csharp',
    { title: 'C# Reference', language: 'C#' },
    'spec/supabase_csharp_v0.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchSwiftLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'swift-lib',
    '/reference/swift',
    { title: 'Swift Reference', language: 'Swift' },
    'spec/supabase_swift_v2.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchKtLibReferenceSource() {
  return new ClientLibReferenceLoader(
    'kt-lib',
    '/reference/kotlin',
    { title: 'Kotlin Reference', language: 'Kotlin' },
    'spec/supabase_kt_v1.yml',
    'spec/common-client-libs-sections.json'
  ).load()
}

export async function fetchCliLibReferenceSource() {
  return new CliReferenceLoader(
    'cli',
    '/reference/cli',
    { title: 'CLI Reference', platform: 'cli' },
    'spec/cli_v1_commands.yaml',
    'spec/common-cli-sections.json'
  ).load()
}

export async function fetchLintWarningsGuideSources() {
  return new LintWarningsGuideLoader(
    'guide',
    '/guides/database/database-advisors',
    'supabase',
    'splinter',
    'main',
    'docs'
  ).load()
}

/**
 * Fetches all the sources we want to index for search
 */
export async function fetchAllSources() {
  const guideSources = fetchGuideSources()
  const lintWarningsGuideSources = fetchLintWarningsGuideSources()
  const openApiReferenceSource = fetchOpenApiReferenceSource()
  const jsLibReferenceSource = fetchJsLibReferenceSource()
  const dartLibReferenceSource = fetchDartLibReferenceSource()
  const pythonLibReferenceSource = fetchPythonLibReferenceSource()
  const cSharpLibReferenceSource = fetchCSharpLibReferenceSource()
  const swiftLibReferenceSource = fetchSwiftLibReferenceSource()
  const ktLibReferenceSource = fetchKtLibReferenceSource()
  const cliReferenceSource = fetchCliLibReferenceSource()

  const partnerIntegrationSources = fetchPartners()
    .then((partners) =>
      partners
        ? Promise.all(
            partners.map((partner) => new IntegrationLoader(partner.slug, partner).load())
          )
        : []
    )
    .then((data) => data.flat())

  const githubDiscussionSources = fetchDiscussions(
    'supabase',
    'supabase',
    'DIC_kwDODMpXOc4CUvEr' // 'Troubleshooting' category
  )
    .then((discussions) =>
      Promise.all(
        discussions.map((discussion) =>
          new GitHubDiscussionLoader('supabase/supabase', discussion).load()
        )
      )
    )
    .then((data) => data.flat())

  const sources: SearchSource[] = (
    await Promise.all([
      guideSources,
      lintWarningsGuideSources,
      openApiReferenceSource,
      jsLibReferenceSource,
      dartLibReferenceSource,
      pythonLibReferenceSource,
      cSharpLibReferenceSource,
      swiftLibReferenceSource,
      ktLibReferenceSource,
      cliReferenceSource,
      partnerIntegrationSources,
      githubDiscussionSources,
    ])
  ).flat()

  return sources
}
