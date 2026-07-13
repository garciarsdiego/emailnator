import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmailContent } from "@/features/email-editor/model/emailDocument";

interface MetadataFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  variations?: string[];
  onChange: (value: string) => void;
}

function MetadataField({ id, label, value, placeholder, variations = [], onChange }: MetadataFieldProps) {
  const hasVariations = variations.length > 1;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
        {hasVariations && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {Math.max(1, variations.indexOf(value) + 1)}/{variations.length}
          </span>
        )}
      </div>
      {hasVariations ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {variations.map((option) => <SelectItem key={option} value={option} className="text-sm">{option}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9" />
      )}
    </div>
  );
}

interface EmailMetadataFieldsProps {
  initialContent?: EmailContent;
  subject: string;
  subjectResend: string;
  preheader: string;
  onSubjectChange: (value: string) => void;
  onSubjectResendChange: (value: string) => void;
  onPreheaderChange: (value: string) => void;
}

export function EmailMetadataFields(props: EmailMetadataFieldsProps) {
  return (
    <div className="space-y-3 border-b bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetadataField id="subject" label="Assunto (1º envio)" value={props.subject} placeholder="Assunto do email..." variations={props.initialContent?.subjectVariations} onChange={props.onSubjectChange} />
        <MetadataField id="subject-resend" label="Assunto (reenvio/A-B)" value={props.subjectResend} placeholder="Assunto alternativo..." variations={props.initialContent?.subjectResendVariations} onChange={props.onSubjectResendChange} />
        <MetadataField id="preheader" label="Pré-header" value={props.preheader} placeholder="Texto de pré-visualização..." variations={props.initialContent?.preheaderVariations} onChange={props.onPreheaderChange} />
      </div>
    </div>
  );
}
