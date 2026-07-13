import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteEmailDocument,
  getEmailDocument,
  listEmailDocuments,
} from "@/features/email-editor/api/emailDocumentsApi";

export function useEmailDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["email-documents", user?.id],
    queryFn: listEmailDocuments,
    enabled: Boolean(user),
  });
  const remove = useMutation({
    mutationFn: deleteEmailDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-documents", user?.id] }),
  });

  return { documents: query.data ?? [], ...query, remove };
}

export function useEmailDocument(documentId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email-document", user?.id, documentId],
    queryFn: () => getEmailDocument(documentId as string),
    enabled: Boolean(user && documentId),
  });
}
