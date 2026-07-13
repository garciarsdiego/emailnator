import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VideoBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Vídeo</h4>
          <div className="space-y-2">
            <Label>URL do vídeo (YouTube/Vimeo)</Label>
            <Input
              value={content.videoUrl || ""}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail (opcional)</Label>
            <Input
              value={content.videoThumbnail || ""}
              onChange={(e) => onUpdate({ videoThumbnail: e.target.value })}
              placeholder="URL da imagem de capa"
            />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={content.videoTitle || ""}
              onChange={(e) => onUpdate({ videoTitle: e.target.value })}
              placeholder="Assista ao vídeo"
            />
          </div>
        </div>
  );
}
