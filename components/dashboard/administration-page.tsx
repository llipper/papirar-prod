"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Check, CircleAlert, LockKeyhole, RefreshCw, ShieldCheck, Upload, BookOpen } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import {
  type AdminLaw,
  type AdminLawVersion,
  type AdminLegalNode,
  currentFirebaseUserIsAdmin,
  listAdminLaws,
  listAdminLegalNodes,
  updateAdminLaw,
  updateAdminLegalNode,
  updateAdminLegalNodeContent,
  updateAdminVersion,
} from "@/lib/admin/legal-catalog-admin-service"

export function currentUserIsAdmin() {
  return currentFirebaseUserIsAdmin()
}

function statusLabel(status: AdminLawVersion["status"]) {
  if (status === "archived") return "Revogada"
  if (status === "published") return "Publicada"
  return "Rascunho / ativa"
}

function isRecentUpdate(version: AdminLawVersion) {
  return Date.now() - new Date(version.imported_at).getTime() < 1000 * 60 * 60 * 24 * 30
}

export function VersionEditor({ law, version, onSaved }: { law: AdminLaw; version: AdminLawVersion; onSaved: (law: AdminLaw) => void }) {
  const [lawName, setLawName] = useState(law.official_name)
  const [shortTitle, setShortTitle] = useState(law.short_title)
  const [versionLabel, setVersionLabel] = useState(version.version_label)
  const [sourceFile, setSourceFile] = useState(version.source_file ?? "")
  const [scopeKey, setScopeKey] = useState(version.scope_key)
  const [status, setStatus] = useState<AdminLawVersion["status"]>(version.status)
  const [isComplete, setIsComplete] = useState(version.is_complete)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [nodes, setNodes] = useState<AdminLegalNode[]>([])
  const [nodesLoading, setNodesLoading] = useState(true)

  useEffect(() => {
    let active = true
    // O carregamento é disparado ao trocar a versão selecionada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodesLoading(true)
    void listAdminLegalNodes(law.law_id, version.id)
      .then((items) => { if (active) setNodes(items) })
      .catch(() => { if (active) setFeedback("Não foi possível carregar o texto desta versão.") })
      .finally(() => { if (active) setNodesLoading(false) })
    return () => { active = false }
  }, [law.law_id, version.id])

  function updateNode(nodeKey: string, values: Partial<AdminLegalNode>) {
    setNodes((items) => items.map((item) => item.node_key === nodeKey ? { ...item, ...values } : item))
  }

  async function save() {
    setSaving(true)
    setFeedback(null)
    try {
      await updateAdminLaw(law.law_id, { official_name: lawName.trim(), short_title: shortTitle.trim() })
      await updateAdminVersion(version.id, {
        version_label: versionLabel.trim(),
        source_file: sourceFile.trim() || null,
        scope_key: scopeKey.trim(),
        status,
        is_complete: isComplete,
      })
      await Promise.all(nodes.flatMap((node) => [updateAdminLegalNode(node), updateAdminLegalNodeContent(node)]))
      setFeedback(`Atualização salva no catálogo com ${nodes.length} elementos de texto.`)
      onSaved({
        ...law,
        official_name: lawName.trim(),
        short_title: shortTitle.trim(),
        updated_at: new Date().toISOString(),
        versions: law.versions.map((item) => item.id === version.id ? { ...item, version_label: versionLabel.trim(), source_file: sourceFile.trim() || null, scope_key: scopeKey.trim(), status, is_complete: isComplete, imported_at: new Date().toISOString() } : item),
      })
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar a atualização.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
      <div className="grid gap-1">
        <p className="text-sm font-medium">Editar livro</p>
        <p className="text-xs text-muted-foreground">Atualize os dados exibidos no catálogo e o estado da versão.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label htmlFor={`name-${law.law_id}`}>Nome oficial</Label><Input id={`name-${law.law_id}`} value={lawName} onChange={(event) => setLawName(event.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor={`short-${law.law_id}`}>Título curto</Label><Input id={`short-${law.law_id}`} value={shortTitle} onChange={(event) => setShortTitle(event.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor={`version-${version.id}`}>Versão</Label><Input id={`version-${version.id}`} value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor={`source-${version.id}`}>Arquivo de origem</Label><Input id={`source-${version.id}`} value={sourceFile} onChange={(event) => setSourceFile(event.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor={`scope-${version.id}`}>Escopo</Label><Input id={`scope-${version.id}`} value={scopeKey} onChange={(event) => setScopeKey(event.target.value)} /></div>
        <div className="grid gap-1.5"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as AdminLawVersion["status"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho / ativa</SelectItem><SelectItem value="published">Publicada</SelectItem><SelectItem value="archived">Revogada</SelectItem></SelectContent></Select></div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={isComplete} onChange={(event) => setIsComplete(event.target.checked)} /> Conteúdo completo e pronto para leitura</label>
      <Separator />
      <div className="grid gap-1"><p className="text-sm font-medium">Texto e estrutura</p><p className="text-xs text-muted-foreground">Edite o conteúdo diretamente. A ordem e os vínculos hierárquicos ficam preservados.</p></div>
      {nodesLoading ? <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground">Carregando texto da versão...</div> : nodes.length === 0 ? <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground">Esta versão ainda não possui conteúdo estruturado.</div> : <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">{nodes.map((node) => <div key={node.node_key} className="grid gap-2 rounded-2xl border bg-background p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{node.node_type}</Badge><span className="text-xs font-medium text-muted-foreground">{node.number || "·"}</span><span className="truncate text-xs text-muted-foreground">{node.node_key}</span></div><div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-1.5"><Label>Rótulo estrutural</Label><Input value={node.label ?? ""} onChange={(event) => updateNode(node.node_key, { label: event.target.value })} placeholder="Título, capítulo ou seção" /></div><div className="grid gap-1.5"><Label>Epígrafe / rubrica</Label><Input value={node.epigraphe} onChange={(event) => updateNode(node.node_key, { epigraphe: event.target.value })} placeholder="Nome do artigo ou rubrica" /></div></div><div className="grid gap-1.5"><Label>Texto</Label><Textarea value={node.text_content} onChange={(event) => updateNode(node.node_key, { text_content: event.target.value })} className="min-h-20" placeholder="Conteúdo do elemento" /></div></div>)}</div>}
      {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
      <div className="flex flex-wrap justify-end gap-2"><Button size="sm" onClick={save} disabled={saving}>{saving ? <RefreshCw className="animate-spin" /> : <Check />}{saving ? "Salvando..." : "Salvar atualização"}</Button></div>
    </div>
  )
}

export function AdministrationPage() {
  const [laws, setLaws] = useState<AdminLaw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setLaws(await listAdminLaws()) } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar o catálogo.") } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (isAdmin === null) {
      void currentUserIsAdmin().then(setIsAdmin).catch(() => setIsAdmin(false))
      return
    }
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    void load()
  }, [isAdmin, load])

  if (isAdmin === null) {
    return <DashboardShell title="Administração" description="Gestão do catálogo jurídico."><Card><CardContent className="p-6 text-sm text-muted-foreground">Validando permissão...</CardContent></Card></DashboardShell>
  }

  if (!isAdmin) {
    return <DashboardShell title="Administração" description="Gestão do catálogo jurídico."><Card className="mx-auto w-full max-w-xl"><CardHeader><div className="flex size-10 items-center justify-center rounded-2xl bg-muted"><LockKeyhole /></div><CardTitle>Acesso restrito</CardTitle><CardDescription>Esta área exige uma conta promovida como administradora.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">A autorização administrativa é validada no Worker antes de cada operação do catálogo.</p></CardContent></Card></DashboardShell>
  }

  return <DashboardShell title="Administração" description="Atualize e revogue versões do catálogo jurídico." action={<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar</Button>}>
    <div className="grid gap-4">
      <Alert><ShieldCheck /><AlertTitle>Catálogo sob controle</AlertTitle><AlertDescription>As alterações são gravadas no Cloudflare D1 pelo Worker, que valida a permissão de administrador em cada operação. Uma versão revogada deixa de ser oferecida para leitura.</AlertDescription></Alert>
      <div className="grid gap-3 sm:grid-cols-3"><Card size="sm"><CardHeader className="px-4"><CardDescription>Livros</CardDescription><CardTitle className="text-2xl">{laws.length}</CardTitle></CardHeader></Card><Card size="sm"><CardHeader className="px-4"><CardDescription>Versões ativas</CardDescription><CardTitle className="text-2xl">{laws.reduce((total, law) => total + law.versions.filter((version) => version.status !== "archived").length, 0)}</CardTitle></CardHeader></Card><Card size="sm"><CardHeader className="px-4"><CardDescription>Novas atualizações</CardDescription><CardTitle className="text-2xl">{laws.reduce((total, law) => total + law.versions.filter(isRecentUpdate).length, 0)}</CardTitle></CardHeader></Card></div>
      {error ? <Alert variant="destructive"><CircleAlert /><AlertTitle>Não foi possível carregar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      {loading ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Carregando livros...</CardContent></Card> : null}
      {!loading && laws.map((law) => { const version = law.versions[0]; const catalogBook = bibliotecaBooks.find((book) => book.lawId === law.law_id); return <Card key={law.law_id} size="sm"><CardHeader className="gap-3 px-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><Badge variant="outline">{law.law_id}</Badge>{version && isRecentUpdate(version) ? <Badge><Upload /> Nova atualização</Badge> : null}</div><CardTitle className="truncate text-base">{law.short_title || law.official_name}</CardTitle><CardDescription className="truncate">{law.official_name}</CardDescription></div>{catalogBook ? <Button asChild variant="outline" size="sm"><Link href={`/dashboard/administracao/${catalogBook.id}`}><BookOpen /> Abrir leitura</Link></Button> : null}</div></CardHeader><CardContent className="grid gap-3 px-4"><Separator />{version ? <div className="flex flex-wrap items-center justify-between gap-3 text-xs"><div className="flex flex-wrap items-center gap-2"><Badge variant={version.status === "archived" ? "destructive" : version.status === "published" ? "default" : "secondary"}>{statusLabel(version.status)}</Badge><span className="text-muted-foreground">Versão {version.version_label} · {version.scope_key}</span></div><span className="text-muted-foreground">{version.is_complete ? "Completa" : "Incompleta"}</span></div> : <p className="text-xs text-muted-foreground">Nenhuma versão cadastrada.</p>}</CardContent></Card> })}
      {!loading && laws.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum livro encontrado.</CardContent></Card> : null}
    </div>
  </DashboardShell>
}
