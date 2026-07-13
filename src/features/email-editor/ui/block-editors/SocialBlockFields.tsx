import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export function SocialBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Redes Sociais</h4>
          <div className="space-y-2">
            {content.socialLinks?.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={link.platform}
                  onValueChange={(v) => {
                    const updated = [...(content.socialLinks || [])];
                    updated[index] = { ...updated[index], platform: v };
                    onUpdate({ socialLinks: updated });
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...(content.socialLinks || [])];
                    updated[index] = { ...updated[index], url: e.target.value };
                    onUpdate({ socialLinks: updated });
                  }}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updated = content.socialLinks?.filter((_, i) => i !== index);
                    onUpdate({ socialLinks: updated });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = [...(content.socialLinks || []), { platform: "instagram", url: "#" }];
                onUpdate({ socialLinks: updated });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar rede
            </Button>
          </div>
        </div>
  );
}
