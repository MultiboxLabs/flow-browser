import { Container, ContainerItem } from "../../components/basic/container";
import { RadioButton } from "@/components/settings/components/basic/radio-button";
import { SectionHeader } from "@/components/settings/components/basic/headers";
import { IconProvider, useIconContext } from "@/components/settings/new-sections/icon/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function IconComp({ src, className }: { src: string; className?: string }) {
  return <img src={src} className={cn("pointer-events-none", className)} />;
}

function IconsContainer() {
  const { icons, selectedIconId, isLoading, isSupported, isUpdating, selectIcon } = useIconContext();

  if (isLoading) {
    return (
      <Container withSeparators>
        {new Array(5).fill(0).map((_, index) => (
          <>
            <ContainerItem
              key={index}
              icon={<Skeleton className="size-10 bg-black/10 dark:bg-white/10" />}
              title={"test message" + "yes".repeat(index + 1)}
              action={<RadioButton active={false} />}
              skeleton
            />
          </>
        ))}
      </Container>
    );
  }

  if (!isSupported) {
    return (
      <Container withSeparators>
        <ContainerItem
          icon={<IconComp src={`flow://asset/icons/default.png`} className="size-10" />}
          title="Icon customization is not supported on this platform."
        />
      </Container>
    );
  }

  return (
    <Container withSeparators>
      {icons.map((icon) => (
        <>
          <ContainerItem
            key={icon.id}
            icon={<IconComp src={`flow://asset/icons/${icon.imageId}`} className="size-10" />}
            title={icon.name}
            description={icon.author}
            action={<RadioButton active={selectedIconId === icon.id} />}
            onClick={() => !isUpdating && selectIcon(icon.id)}
          />
        </>
      ))}
    </Container>
  );
}

export function InnerIconSection() {
  return (
    <>
      <SectionHeader
        title="App Icon"
        description="Customize Flow's app icon."
        icon={<IconComp src={`flow://asset/liquid-glass-icon.png`} className="size-full" />}
      />
      <IconsContainer />
    </>
  );
}

export function IconSection() {
  return (
    <IconProvider>
      <InnerIconSection />
    </IconProvider>
  );
}
