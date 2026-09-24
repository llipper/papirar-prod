"use client"

import { memo, useCallback, useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import { currentUserIsAdmin } from "@/components/dashboard/administration-page"
import {
  createAdminLegalNode,
  listAdminLegalNodesPage,
  listAdminLaws,
  revokeAdminLegalNode,
  updateAdminLegalNode,
  updateAdminLegalNodeContent,
  updateAdminLegalNodeOrder,
  updateAdminVersion,
  type AdminLaw,
  type AdminLegalNode,
} from "@/lib/admin/legal-catalog-admin-service"

const NODE_TYPES = [
  ["parte", "Parte"],
  ["titulo", "Título"],
  ["capitulo", "Capítulo"],
  ["secao", "Seção"],
  ["subsecao", "Subseção"],
  ["artigo", "Artigo"],
  ["paragrafo", "Parágrafo"],
  ["inciso", "Inciso"],
  ["alinea", "Alínea"],
] as const

const ADMIN_NODE_PAGE_SIZE = 60

type NodeType = (typeof NODE_TYPES)[number][0]
type NodePlacement = "above" | "below" | "child"

const PLACEMENT_LABELS: Record<NodePlacement, string> = {
  above: "Acima",
  below: "Abaixo",
  child: "Filho",
}

function newNodeKey(lawId: string, nodeType: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${lawId}.admin_${nodeType}_${suffix}`
}

function isDescendantOf(
  node: AdminLegalNode,
  ancestorKey: string,
  nodesByKey: Map<string, AdminLegalNode>,
) {
  let parentKey = node.parent_key
  while (parentKey) {
    if (parentKey === ancestorKey) return true
    parentKey = nodesByKey.get(parentKey)?.parent_key ?? null
  }
  return false
}

type AdminLegalNodeDraft = Pick<
  AdminLegalNode,
  "number" | "label" | "epigraphe" | "text_content"
>

type AdminLegalNodeEditorProps = {
  node: AdminLegalNode
  index: number
  count: number
  operationInProgress: boolean
  onSave: (node: AdminLegalNode, draft: AdminLegalNodeDraft) => Promise<void>
  onMove: (index: number, direction: -1 | 1) => void
  onAdd: (
    node: AdminLegalNode,
    placement: NodePlacement,
    nodeType: NodeType,
  ) => void
  onRevoke: (node: AdminLegalNode) => void
}

function AddNodeMenu({
  label,
  disabled,
  onSelect,
}: {
  label: string
  disabled: boolean
  onSelect: (nodeType: NodeType) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Plus /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuLabel>Tipo do elemento</DropdownMenuLabel>
        {NODE_TYPES.map(([value, typeLabel]) => (
          <DropdownMenuItem key={value} onSelect={() => onSelect(value)}>
            {typeLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AdminLegalNodeEditor = memo(function AdminLegalNodeEditor({
  node,
  index,
  count,
  operationInProgress,
  onSave,
  onMove,
  onAdd,
  onRevoke,
}: AdminLegalNodeEditorProps) {
  const [draft, setDraft] = useState<AdminLegalNodeDraft>(() => ({
    number: node.number,
    label: node.label,
    epigraphe: node.epigraphe,
    text_content: node.text_content,
  }))
  const [saving, setSaving] = useState(false)

  function changeDraft(patch: Partial<AdminLegalNodeDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function save() {
    if (saving || operationInProgress) return
    setSaving(true)
    try {
      await onSave(node, draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="group border-b py-7 first:border-t">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {node.node_type}
        </span>
        <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Mover para cima"
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || operationInProgress || saving}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Mover para baixo"
            onClick={() => onMove(index, 1)}
            disabled={index === count - 1 || operationInProgress || saving}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Salvar elemento"
            onClick={() => void save()}
            disabled={operationInProgress || saving}
          >
            <Save />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            title="Remover elemento"
            onClick={() => onRevoke(node)}
            disabled={operationInProgress || saving}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
        <Input
          className="rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none"
          aria-label="Número"
          placeholder="Número"
          value={draft.number ?? ""}
          onChange={(event) => changeDraft({ number: event.target.value })}
        />
        <Input
          className="rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none"
          aria-label="Título ou rótulo"
          placeholder="Título ou rótulo"
          value={draft.label ?? ""}
          onChange={(event) => changeDraft({ label: event.target.value })}
        />
      </div>
      <Input
        className="mt-2 rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none"
        aria-label="Epígrafe"
        placeholder="Epígrafe (opcional)"
        value={draft.epigraphe}
        onChange={(event) => changeDraft({ epigraphe: event.target.value })}
      />
      <Textarea
        className="mt-3 min-h-24 rounded-none border-0 border-b border-border bg-transparent px-1 font-serif leading-7 shadow-none"
        aria-label="Texto"
        placeholder="Texto do elemento"
        value={draft.text_content}
        onChange={(event) => changeDraft({ text_content: event.target.value })}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["above", "below", "child"] as const).map((placement) => (
          <AddNodeMenu
            key={placement}
            label={PLACEMENT_LABELS[placement]}
            disabled={operationInProgress || saving}
            onSelect={(nodeType) => onAdd(node, placement, nodeType)}
          />
        ))}
        {saving ? (
          <span className="text-xs text-muted-foreground">Salvando…</span>
        ) : null}
      </div>
    </article>
  )
})

export function AdministrationReadingPage({ bookId }: { bookId: string }) {
  const router = useRouter()
  const book = bibliotecaBooks.find((item) => item.id === bookId)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [record, setRecord] = useState<AdminLaw | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<AdminLegalNode[]>([])
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin === null) {
      void currentUserIsAdmin()
        .then(setIsAdmin)
        .catch(() => setIsAdmin(false))
      return
    }
    if (!isAdmin || !book?.lawId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    let active = true
    void listAdminLaws()
      .then(async (items) => {
        const found = items.find((item) => item.law_id === book.lawId)
        const version = found?.versions[0]
        if (!found || !version)
          throw new Error(
            "Livro ou versão não encontrado no catálogo administrativo."
          )
        const page = await listAdminLegalNodesPage(
          found.law_id,
          version.id,
          0,
          ADMIN_NODE_PAGE_SIZE,
        )
        if (!active) return
        setRecord(found)
        setVersionId(version.id)
        setNodes(page.nodes)
        setNextOffset(page.next_offset)
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o texto."
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [book?.lawId, isAdmin])

  const saveNode = useCallback(
    async (node: AdminLegalNode, draft: AdminLegalNodeDraft) => {
      const updatedNode = { ...node, ...draft }
      setFeedback(null)
      try {
        if (node.id.startsWith("new-")) {
          if (!record || !versionId) return
          const result = await createAdminLegalNode({
            law_id: record.law_id,
            law_version_id: versionId,
            node_key: node.node_key,
            parent_key: node.parent_key,
            node_type: node.node_type,
            number: draft.number || null,
            label: draft.label || null,
            epigraphe: draft.epigraphe,
            text_content: draft.text_content,
            sort_order: node.sort_order,
          })
          setNodes((current) => current.map((item) =>
            item.node_key === node.node_key
              ? { ...updatedNode, id: result.id }
              : item,
          ))
          setNextOffset((currentOffset) =>
            currentOffset === null ? null : currentOffset + 1,
          )
          setFeedback(`${draft.number || node.node_type} adicionado e salvo.`)
          return
        }
        await Promise.all([
          updateAdminLegalNode(updatedNode),
          updateAdminLegalNodeContent(updatedNode),
        ])
        setNodes((current) => current.map((item) =>
          item.node_key === node.node_key ? updatedNode : item,
        ))
        setFeedback(`${updatedNode.number || updatedNode.node_type} salvo.`)
      } catch (reason) {
        setFeedback(
          reason instanceof Error
            ? reason.message
            : "Não foi possível salvar este elemento."
        )
      }
    },
    [record, versionId],
  )

  async function moveNode(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= nodes.length || saving) return
    const currentNode = nodes[index]
    const adjacentNode = nodes[target]
    const next = [...nodes]
    next[index] = { ...currentNode, sort_order: adjacentNode.sort_order }
    next[target] = { ...adjacentNode, sort_order: currentNode.sort_order }
    setNodes(next)
    setSaving("__order__")
    try {
      await Promise.all([
        updateAdminLegalNodeOrder(currentNode.id, adjacentNode.sort_order),
        updateAdminLegalNodeOrder(adjacentNode.id, currentNode.sort_order),
      ])
      setFeedback("Ordem atualizada.")
    } catch (reason) {
      setFeedback(
        reason instanceof Error
          ? reason.message
          : "Não foi possível mover o elemento."
      )
    } finally {
      setSaving(null)
    }
  }

  function addNode(
    target: AdminLegalNode | null,
    placement: NodePlacement,
    nodeType: NodeType,
  ) {
    if (!versionId || !record || saving) return
    const key = newNodeKey(record.law_id, nodeType)
    const parentKey =
      placement === "child"
        ? (target?.node_key ?? null)
        : (target?.parent_key ?? null)
    const targetIndex = target
      ? nodes.findIndex((node) => node.node_key === target.node_key)
      : -1
    if (target && targetIndex < 0) return
    const nodesByKey = new Map(nodes.map((node) => [node.node_key, node]))
    let insertAt = 0
    if (target && placement === "above") {
      insertAt = targetIndex
    } else if (target) {
      let lastDescendantIndex = targetIndex
      for (let index = targetIndex + 1; index < nodes.length; index += 1) {
        if (isDescendantOf(nodes[index], target.node_key, nodesByKey))
          lastDescendantIndex = index
      }
      insertAt = lastDescendantIndex + 1
    }
    const following = nodes[insertAt] ?? null
    const previous = nodes[insertAt - 1] ?? null
    const sortOrder = previous && following
      ? (previous.sort_order + following.sort_order) / 2
      : previous
        ? previous.sort_order + 1
        : following
          ? following.sort_order - 1
          : 0
    const created: AdminLegalNode = {
      id: `new-${key}`,
      node_key: key,
      parent_key: parentKey,
      node_type: nodeType,
      number: "",
      label: "",
      epigraphe: "",
      text_content: "",
      sort_order: sortOrder,
    }
    const next = [...nodes]
    next.splice(Math.max(0, insertAt), 0, created)
    setNodes(next)
    setFeedback(`Rascunho de ${NODE_TYPES.find(([value]) => value === nodeType)?.[1] ?? nodeType} criado. Preencha e clique em salvar.`)
  }

  async function loadMoreNodes() {
    if (!record || !versionId || nextOffset === null || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await listAdminLegalNodesPage(
        record.law_id,
        versionId,
        nodes.length,
        ADMIN_NODE_PAGE_SIZE,
      )
      setNodes((current) => [...current, ...page.nodes])
      setNextOffset(page.next_offset)
    } catch (reason) {
      setFeedback(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar a próxima parte do catálogo.",
      )
    } finally {
      setLoadingMore(false)
    }
  }

  async function revokeNode(node: AdminLegalNode) {
    if (saving) return
    if (node.id.startsWith("new-")) {
      setNodes((current) => current.filter((item) => item.node_key !== node.node_key))
      setFeedback("Rascunho descartado.")
      return
    }
    const originalIndex = nodes.findIndex((item) => item.node_key === node.node_key)
    setNodes((current) => current.filter((item) => item.node_key !== node.node_key))
    setFeedback(`${node.number || node.node_type} removido. Confirmando…`)
    try {
      await revokeAdminLegalNode(node.id)
      setNextOffset((currentOffset) =>
        currentOffset === null ? null : Math.max(0, currentOffset - 1),
      )
      setFeedback("Elemento removido do texto.")
    } catch (reason) {
      setNodes((current) => {
        if (current.some((item) => item.node_key === node.node_key)) return current
        const restored = [...current]
        restored.splice(Math.max(0, Math.min(originalIndex, restored.length)), 0, node)
        return restored
      })
      setFeedback(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover o elemento."
      )
    }
  }

  async function revokeVersion() {
    const version = record?.versions[0]
    if (!version || saving) return
    setSaving("__version__")
    try {
      await updateAdminVersion(version.id, {
        version_label: version.version_label,
        source_file: version.source_file,
        scope_key: version.scope_key,
        status: "archived",
        is_complete: version.is_complete,
      })
      setFeedback("Versão revogada.")
      setTimeout(() => router.push("/dashboard/administracao"), 700)
    } catch (reason) {
      setFeedback(
        reason instanceof Error
          ? reason.message
          : "Não foi possível revogar a versão."
      )
    } finally {
      setSaving(null)
    }
  }

  if (isAdmin === null)
    return (
      <DashboardShell title="Administração" description="Validando acesso ao catálogo.">
        <div className="text-sm text-muted-foreground">Validando permissão…</div>
      </DashboardShell>
    )
  if (!isAdmin)
    return (
      <DashboardShell title="Administração" description="Gestão do catálogo jurídico.">
        <Alert className="mx-auto w-full max-w-xl">
          <ShieldAlert />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta área exige uma conta administradora.
          </AlertDescription>
        </Alert>
      </DashboardShell>
    )
  if (!book)
    return (
      <DashboardShell title="Administração" description="Gestão do catálogo jurídico.">
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Livro não encontrado</AlertTitle>
        </Alert>
      </DashboardShell>
    )
  if (loading)
    return (
      <DashboardShell title="Administração" description={`${book.title} · edição direta`}>
        <div className="text-sm text-muted-foreground">
          Carregando os primeiros {ADMIN_NODE_PAGE_SIZE} dispositivos para edição…
        </div>
      </DashboardShell>
    )
  if (error)
    return (
      <DashboardShell title="Administração" description={`${book.title} · edição direta`}>
        <Alert variant="destructive" className="max-w-xl">
          <CircleAlert />
          <AlertTitle>Não foi possível abrir a edição</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardShell>
    )

  return (
    <DashboardShell
      title="Administração"
      description={`${record?.short_title ?? book.title} · edição direta do catálogo`}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">{record?.official_name ?? book.title}</p>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/administracao")}
            >
              <ArrowLeft /> Catálogo
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void revokeVersion()}
              disabled={Boolean(saving)}
            >
              <ShieldAlert /> Revogar versão
            </Button>
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-4xl px-5 pt-8">
        <div className="mb-8 border-b pb-5">
          <p className="text-sm font-medium">Texto completo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Edite diretamente como em um documento. Cada alteração fica no
            próprio elemento; use Salvar, mover, inserir ou remover.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AddNodeMenu
              label="Adicionar no início"
              disabled={Boolean(saving)}
              onSelect={(nodeType) => addNode(null, "below", nodeType)}
            />
          </div>
        </div>
        <div>
          {nodes.map((node, index) => (
            <AdminLegalNodeEditor
              key={node.node_key}
              node={node}
              index={index}
              count={nodes.length}
              operationInProgress={Boolean(saving)}
              onSave={saveNode}
              onMove={moveNode}
              onAdd={addNode}
              onRevoke={revokeNode}
            />
          ))}
          {nextOffset !== null ? (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                onClick={() => void loadMoreNodes()}
                disabled={loadingMore || Boolean(saving)}
              >
                {loadingMore
                  ? "Carregando…"
                  : `Carregar mais dispositivos (${nodes.length} carregados)`}
              </Button>
            </div>
          ) : null}
      </div>
      </section>
      {feedback ? (
        <div className="fixed right-5 bottom-5 z-30 max-w-sm rounded-xl border bg-card px-4 py-3 text-sm shadow-lg">
          {feedback}
        </div>
      ) : null}
    </DashboardShell>
  )
}
