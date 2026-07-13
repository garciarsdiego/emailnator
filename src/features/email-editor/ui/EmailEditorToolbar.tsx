import { Code, Download, Eye, Monitor, Save, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EditorMode, PreviewDevice } from "@/features/email-editor/model/editorView";

interface EmailEditorToolbarProps {
  mode: EditorMode;
  device: PreviewDevice;
  isSaving: boolean;
  canSave: boolean;
  canCancel: boolean;
  onModeChange: (mode: EditorMode) => void;
  onDeviceChange: (device: PreviewDevice) => void;
  onClear: () => void;
  onExport: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function EmailEditorToolbar(props: EmailEditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 p-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Tabs value={props.mode} onValueChange={(value) => props.onModeChange(value as EditorMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="edit" className="h-7 px-3 text-xs">Editar</TabsTrigger>
            <TabsTrigger value="preview" className="h-7 px-3 text-xs"><Eye className="mr-1 h-3.5 w-3.5" />Preview</TabsTrigger>
            <TabsTrigger value="html" className="h-7 px-3 text-xs"><Code className="mr-1 h-3.5 w-3.5" />HTML</TabsTrigger>
          </TabsList>
        </Tabs>
        {props.mode === "preview" && (
          <div className="ml-2 flex items-center gap-1" aria-label="Largura do preview">
            <Button aria-label="Preview desktop" variant={props.device === "desktop" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => props.onDeviceChange("desktop")}><Monitor className="h-4 w-4" /></Button>
            <Button aria-label="Preview mobile" variant={props.device === "mobile" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => props.onDeviceChange("mobile")}><Smartphone className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={props.onClear}><Trash2 className="mr-1 h-3.5 w-3.5" />Limpar</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={props.onExport}><Download className="mr-1 h-3.5 w-3.5" />HTML</Button>
        {props.canCancel && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={props.onCancel}>Cancelar</Button>}
        {props.canSave && <Button size="sm" className="h-7 text-xs" onClick={props.onSave} disabled={props.isSaving}><Save className={props.isSaving ? "mr-1 h-3.5 w-3.5 animate-pulse" : "mr-1 h-3.5 w-3.5"} />{props.isSaving ? "Salvando..." : "Salvar"}</Button>}
      </div>
    </div>
  );
}
