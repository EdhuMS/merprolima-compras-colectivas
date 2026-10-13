import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { PurchaseRepository } from "./ports";
export function usePurchases(
  repository: PurchaseRepository,
  workspaceKey: string,
) {
  const client = useQueryClient();
  const key = ["purchases", workspaceKey];
  const query = useQuery({
    queryKey: key,
    queryFn: () => repository.read(),
    refetchInterval: workspaceKey === "demo" ? false : 15000,
  });
  const mutation = useMutation({
    mutationFn: (task: () => Promise<void>) => task(),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  return { query, mutation };
}
