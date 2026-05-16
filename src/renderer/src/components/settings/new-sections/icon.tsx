import { SunIcon } from "lucide-react";
import { Container, ContainerItem } from "../components/basic/container";

export function IconSection() {
  return (
    <>
      <Container withSeparators>
        {new Array(100).fill(0).map((_, index) => (
          <>
            <ContainerItem
              key={`item-${index}`}
              icon={<SunIcon name="icon" />}
              title="Title"
              description="Description"
            />
          </>
        ))}
      </Container>
    </>
  );
}
