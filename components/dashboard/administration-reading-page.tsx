"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, CircleAlert, Plus, Save, ShieldAlert, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import { currentUserIsAdmin } from "@/components/dashboard/administration-page"
import { createAdminLegalNode, createAdminLegalNodeContent, listAdminLegalNodes, listAdminLaws, revokeAdminLegalNode, updateAdminLegalNode, updateAdminLegalNodeContent, updateAdminLegalNodeOrder, updateAdminVersion, type AdminLaw, type AdminLegalNode } from "@/lib/admin/legal-catalog-admin-service"

const NODE_TYPES = [["parte", "Parte"], ["titulo", "Título"], ["capitulo", "Capítulo"], ["secao", "Seção"], ["subsecao", "Subseção"], ["artigo", "Artigo"], ["paragrafo", "Parágrafo"], ["inciso", "Inciso"], ["alinea", "Alínea"]] as const

function newNodeKey(lawId: string, nodeType: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${lawId}.admin_${nodeType}_${suffix}`
}

export function AdministrationReadingPage({ bookId }: { bookId: string }) {
  const router = useRouter()
  const book = bibliotecaBooks.find((item) => item.id === bookId)
  const isAdmin = currentUserIsAdmin()
  const [record, setRecord] = useState<AdminLaw | null>(null)
  const [versionId, setVersionId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<AdminLegalNode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [newType, setNewType] = useState("artigo")

  useEffect(() => {
    if (!isAdmin || !book?.lawId) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    let active = true
    void listAdminLaws().then(async (items) => {
      const found = items.find((item) => item.law_id === book.lawId)
      const version = found?.versions[0]
      if (!found || !version) throw new Error("Livro ou versão não encontrado no catálogo administrativo.")
      const loadedNodes = await listAdminLegalNodes(found.law_id, version.id)
      if (!active) return
      setRecord(found); setVersionId(version.id); setNodes(loadedNodes)
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o texto.") }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [book?.lawId, isAdmin])

  function changeNode(nodeKey: string, patch: Partial<AdminLegalNode>) {
    setNodes((current) => current.map((node) => node.node_key === nodeKey ? { ...node, ...patch } : node))
  }

  async function saveNode(node: AdminLegalNode) {
    if (saving || node.id.startsWith("new-")) return
    setSaving(node.node_key); setFeedback(null)
    try { await Promise.all([updateAdminLegalNode(node), updateAdminLegalNodeContent(node)]); setFeedback(`${node.number || node.node_type} salvo.`) }
    catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Não foi possível salvar este elemento.") }
    finally { setSaving(null) }
  }

  async function persistOrder(next: AdminLegalNode[]) {
    await Promise.all(next.filter((node) => !node.id.startsWith("new-")).map((node, index) => updateAdminLegalNodeOrder(node.id, (index + 1) * 10)))
  }

  async function moveNode(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= nodes.length || saving) return
    const next = [...nodes]; [next[index], next[target]] = [next[target], next[index]]
    next.forEach((node, position) => { node.sort_order = (position + 1) * 10 }); setNodes(next); setSaving("__order__")
    try { await persistOrder(next); setFeedback("Ordem atualizada.") } catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Não foi possível mover o elemento.") }
    finally { setSaving(null) }
  }

  async function addNode(target: AdminLegalNode | null, placement: "above" | "below" | "child") {
    if (!versionId || !record || saving) return
    const key = newNodeKey(record.law_id, newType)
    const parentKey = placement === "child" ? target?.node_key ?? null : target?.parent_key ?? null
    const insertAt = target ? nodes.findIndex((node) => node.node_key === target.node_key) + (placement === "above" ? 0 : 1) : 0
    const created: AdminLegalNode = { id: `new-${key}`, node_key: key, parent_key: parentKey, node_type: newType, number: "", label: "", epigraphe: "", text_content: "", sort_order: 0 }
    const next = [...nodes]; next.splice(Math.max(0, insertAt), 0, created); next.forEach((node, index) => { node.sort_order = (index + 1) * 10 }); setNodes(next); setSaving("__new__")
    try {
      await createAdminLegalNode({ law_id: record.law_id, node_key: key, parent_key: parentKey, node_type: newType, number: null, label: "" })
      await createAdminLegalNodeContent({ law_version_id: versionId, node_key: key, epigraphe: "", text_content: "", sort_order: created.sort_order })
      await persistOrder(next)
      setNodes(await listAdminLegalNodes(record.law_id, versionId)); setFeedback("Novo elemento adicionado. Edite o texto e salve.")
    } catch (reason) { setNodes(nodes); setFeedback(reason instanceof Error ? reason.message : "Não foi possível adicionar o elemento.") }
    finally { setSaving(null) }
  }

  async function revokeNode(node: AdminLegalNode) {
    if (saving) return
    setSaving(node.node_key)
    try { await revokeAdminLegalNode(node.id); setNodes((current) => current.filter((item) => item.node_key !== node.node_key)); setFeedback("Elemento removido do texto.") }
    catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Não foi possível remover o elemento.") }
    finally { setSaving(null) }
  }

  async function revokeVersion() {
    const version = record?.versions[0]
    if (!version || saving) return
    setSaving("__version__")
    try {
      await updateAdminVersion(version.id, { version_label: version.version_label, source_file: version.source_file, scope_key: version.scope_key, status: "archived", is_complete: version.is_complete })
      setFeedback("Versão revogada.")
      setTimeout(() => router.push("/dashboard/administracao"), 700)
    } catch (reason) { setFeedback(reason instanceof Error ? reason.message : "Não foi possível revogar a versão.") }
    finally { setSaving(null) }
  }

  if (!isAdmin) return <div className="flex min-h-screen items-center justify-center p-6"><Alert className="max-w-xl"><ShieldAlert /><AlertTitle>Acesso restrito</AlertTitle><AlertDescription>Esta área exige uma conta administradora.</AlertDescription></Alert></div>
  if (!book) return <div className="p-6"><Alert variant="destructive"><CircleAlert /><AlertTitle>Livro não encontrado</AlertTitle></Alert></div>
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando texto para edição…</div>
  if (error) return <div className="flex min-h-screen items-center justify-center p-6"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Não foi possível abrir a edição</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>

  return <main className="min-h-screen bg-background pb-24">
    <header className="sticky top-0 z-20 border-b bg-background/95 px-5 py-3 backdrop-blur"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">Administração · edição direta</p><h1 className="truncate text-lg font-semibold">{record?.short_title ?? book.title}</h1></div><div className="flex shrink-0 gap-2"><Button variant="outline" onClick={() => router.push("/dashboard/administracao")}><ArrowLeft /> Catálogo</Button><Button variant="destructive" onClick={() => void revokeVersion()} disabled={Boolean(saving)}><ShieldAlert /> Revogar versão</Button></div></div></header>
    <section className="mx-auto max-w-4xl px-5 pt-8">
      <div className="mb-8 border-b pb-5"><p className="text-sm font-medium">Texto completo</p><p className="mt-1 text-xs text-muted-foreground">Edite diretamente como em um documento. Cada alteração fica no próprio elemento; use Salvar, mover, inserir ou remover.</p><div className="mt-4 flex flex-wrap items-center gap-2"><select value={newType} onChange={(event) => setNewType(event.target.value)} className="h-9 rounded-xl border bg-background px-3 text-sm">{NODE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="outline" size="sm" onClick={() => void addNode(null, "below")} disabled={Boolean(saving)}><Plus /> Adicionar no início</Button></div></div>
      <div>{nodes.map((node, index) => <article key={node.node_key} className="group border-b py-7 first:border-t"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{node.node_type}</span><div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100"><Button variant="ghost" size="icon-sm" title="Mover para cima" onClick={() => void moveNode(index, -1)} disabled={index === 0 || Boolean(saving)}><ArrowUp /></Button><Button variant="ghost" size="icon-sm" title="Mover para baixo" onClick={() => void moveNode(index, 1)} disabled={index === nodes.length - 1 || Boolean(saving)}><ArrowDown /></Button><Button variant="ghost" size="icon-sm" title="Salvar elemento" onClick={() => void saveNode(node)} disabled={Boolean(saving) || node.id.startsWith("new-")}><Save /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Remover elemento" onClick={() => void revokeNode(node)} disabled={Boolean(saving)}><Trash2 /></Button></div></div><div className="grid gap-2 sm:grid-cols-[150px_1fr]"><Input className="rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none" aria-label="Número" placeholder="Número" value={node.number ?? ""} onChange={(event) => changeNode(node.node_key, { number: event.target.value })} /><Input className="rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none" aria-label="Título ou rótulo" placeholder="Título ou rótulo" value={node.label ?? ""} onChange={(event) => changeNode(node.node_key, { label: event.target.value })} /></div><Input className="mt-2 rounded-none border-0 border-b border-border bg-transparent px-1 shadow-none" aria-label="Epígrafe" placeholder="Epígrafe (opcional)" value={node.epigraphe} onChange={(event) => changeNode(node.node_key, { epigraphe: event.target.value })} /><Textarea className="mt-3 min-h-24 rounded-none border-0 border-b border-border bg-transparent px-1 font-serif leading-7 shadow-none" aria-label="Texto" placeholder="Texto do elemento" value={node.text_content} onChange={(event) => changeNode(node.node_key, { text_content: event.target.value })} /><div className="mt-4 flex flex-wrap items-center gap-2"><Button variant="ghost" size="sm" onClick={() => void addNode(node, "above")} disabled={Boolean(saving)}><Plus /> Acima</Button><Button variant="ghost" size="sm" onClick={() => void addNode(node, "below")} disabled={Boolean(saving)}><Plus /> Abaixo</Button><Button variant="ghost" size="sm" onClick={() => void addNode(node, "child")} disabled={Boolean(saving)}><Plus /> Filho</Button>{saving === node.node_key ? <span className="text-xs text-muted-foreground">Salvando…</span> : null}</div></article>)}</div>
    </section>
    {feedback ? <div className="fixed right-5 bottom-5 z-30 max-w-sm rounded-xl border bg-card px-4 py-3 text-sm shadow-lg">{feedback}</div> : null}
  </main>
}
