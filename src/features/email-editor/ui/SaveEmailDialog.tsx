import { Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveEmailDialogProps {
  open: boolean;
  isSaving: boolean;
  subject: string;
  templateName: string;
  onOpenChange: (open: boolean) => void;
  onTemplateNameChange: (value: string) => void;
  onConfirm: () => void;
}

export function SaveEmailDialog(props: SaveEmailDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Salvar email</DialogTitle></DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do template <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="template-name" value={props.templateName} onChange={(event) => props.onTemplateNameChange(event.target.value)} placeholder="Ex.: Email de boas-vindas" />
          </div>
          <div className="space-y-1 rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Assunto:</p><p className="text-sm font-medium">{props.subject || "(sem assunto)"}</p></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.isSaving}>Cancelar</Button>
            <Button onClick={props.onConfirm} disabled={props.isSaving}><Save className="mr-2 h-4 w-4" />{props.isSaving ? "Salvando..." : "Salvar email"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
