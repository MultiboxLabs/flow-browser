import { SunIcon } from "lucide-react";
import { Container, ContainerItem } from "../../components/basic/container";
import { RadioButton } from "@/components/settings/components/basic/radio-button";
import { useState } from "react";

export function IconSection() {
  const [selected, setSelected] = useState(-1);

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
              action={<RadioButton active={selected === index} />}
              onClick={() => setSelected(index)}
            />
          </>
        ))}
      </Container>
    </>
  );
}
