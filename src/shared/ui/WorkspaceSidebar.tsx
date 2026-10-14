import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export function useWorkspaceSidebar() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  );
  const [desktopVisible, setDesktopVisible] = useState(
    () => localStorage.getItem("merprolima:sidebar") !== "hidden",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setIsMobile(media.matches);
      setMobileOpen(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const setVisible = (next: boolean) => {
    setDesktopVisible(next);
    localStorage.setItem("merprolima:sidebar", next ? "visible" : "hidden");
  };
  return {
    isMobile,
    desktopVisible,
    mobileOpen,
    setMobileOpen,
    toggleRef,
    expanded: isMobile ? mobileOpen : desktopVisible,
    toggle: () =>
      isMobile ? setMobileOpen(!mobileOpen) : setVisible(!desktopVisible),
    close: () => {
      if (isMobile) setMobileOpen(false);
      else setVisible(false);
      requestAnimationFrame(() => toggleRef.current?.focus());
    },
  };
}
export function WorkspaceSidebar({
  navigation,
  children,
}: {
  navigation: ReturnType<typeof useWorkspaceSidebar>;
  children: ReactNode;
}) {
  const contents = (
    <>
      <button
        className="sidebar-close"
        aria-label="Ocultar panel lateral"
        onClick={navigation.close}
      >
        <X size={20} />
      </button>
      {children}
    </>
  );
  if (!navigation.isMobile)
    return navigation.desktopVisible ? (
      <aside id="workspace-navigation" className="sidebar">
        {contents}
      </aside>
    ) : null;
  return (
    <Dialog.Root
      open={navigation.mobileOpen}
      onOpenChange={navigation.setMobileOpen}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="navigation-overlay" />
        <Dialog.Content
          id="workspace-navigation"
          className="sidebar navigation-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            navigation.toggleRef.current?.focus();
          }}
        >
          <Dialog.Title className="sr-only">
            Navegación del mercado
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Accede a tus necesidades, compras colectivas y reportes.
          </Dialog.Description>
          {contents}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
