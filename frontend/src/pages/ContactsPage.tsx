import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { ContactForm, type ContactFormData } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  UsersIcon,
  MailIcon,
  SendIcon,
} from "lucide-react";

type Contact = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship: string | null;
  is_active: boolean;
  created_at: string;
};

export function ContactsPage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const contactsQuery = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data } = await api.get("/api/contacts");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ContactFormData) => {
      const { data } = await api.post("/api/contacts", formData);
      return data;
    },
    onSuccess: () => {
      toast.success("Contact added successfully");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setIsAddOpen(false);
    },
    onError: () => {
      toast.error("Could not add contact. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...formData
    }: ContactFormData & { id: string }) => {
      const { data } = await api.put(`/api/contacts/${id}`, formData);
      return data;
    },
    onSuccess: () => {
      toast.success("Contact updated successfully");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditingContact(null);
    },
    onError: () => {
      toast.error("Could not update contact. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/contacts/${id}`);
    },
    onSuccess: () => {
      toast.success("Contact removed");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeletingContact(null);
    },
    onError: () => {
      toast.error("Could not remove contact. Please try again.");
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/contacts/${id}/test-email`);
    },
    onSuccess: () => {
      toast.success("Test email sent");
    },
    onError: () => {
      toast.error("Could not send test email. Please try again.");
    },
  });

  const contacts = contactsQuery.data ?? [];

  if (contactsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Emergency Contacts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contacts.length} of 10 contacts
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          disabled={contacts.length >= 10}
        >
          <PlusIcon className="size-4" />
          Add Contact
        </Button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No contacts yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first emergency contact so someone is notified if you
              miss a check-in.
            </p>
            <Button className="mt-2" onClick={() => setIsAddOpen(true)}>
              <PlusIcon className="size-4" />
              Add your first contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MailIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    {contact.relationship && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {contact.relationship}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={contact.is_active ? "secondary" : "outline"}
                    className={
                      contact.is_active
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : ""
                    }
                  >
                    {contact.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testEmailMutation.mutate(contact.id)}
                    disabled={testEmailMutation.isPending}
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <SendIcon className="size-3.5" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingContact(contact)}
                  >
                    <PencilIcon className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletingContact(contact)}
                  >
                    <Trash2Icon className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent showCloseButton={false}>
          <ContactForm
            onSubmit={(data) => createMutation.mutateAsync(data)}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingContact}
        onOpenChange={(open) => {
          if (!open) setEditingContact(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          {editingContact && (
            <ContactForm
              contact={{
                id: editingContact.id,
                name: editingContact.name,
                email: editingContact.email,
                relationship: editingContact.relationship ?? undefined,
              }}
              onSubmit={(data) =>
                updateMutation.mutateAsync({
                  id: editingContact.id,
                  ...data,
                })
              }
              onCancel={() => setEditingContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingContact}
        onOpenChange={(open) => {
          if (!open) setDeletingContact(null);
        }}
      >
        <DialogContent>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-heading text-base font-medium">
                Remove contact
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">
                  {deletingContact?.name}
                </span>
                ? They will no longer be notified if you miss a check-in.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingContact(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deletingContact) {
                    deleteMutation.mutate(deletingContact.id);
                  }
                }}
              >
                {deleteMutation.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
