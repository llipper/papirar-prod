import {
  BookOpenIcon,
  FilePenLineIcon,
  HighlighterIcon,
  HouseIcon,
  LogOutIcon,
  Settings2Icon,
  UserCircleIcon,
} from "lucide-react"

export const sidebarNavigation = {
  primary: [
    { title: "Home", href: "/dashboard", icon: HouseIcon },
    { title: "Biblioteca", href: "/dashboard/biblioteca", icon: BookOpenIcon },
    { title: "Anotações", href: "/dashboard/anotacoes", icon: FilePenLineIcon },
    { title: "Marcações", href: "/dashboard/marcacoes", icon: HighlighterIcon },
    { title: "Perfil", href: "/dashboard/perfil", icon: UserCircleIcon },
  ],
  footer: [
    {
      title: "Configuração",
      href: "/dashboard/configuracao",
      icon: Settings2Icon,
    },
    { title: "Sair da conta", href: "/login", icon: LogOutIcon },
  ],
} as const
