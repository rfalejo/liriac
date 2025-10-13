import { Stack, TextField } from "@mui/material";

type MetadataFormState = {
  title: string;
  author: string;
  synopsis: string;
};

type FieldKey = keyof MetadataFormState;

type FieldConfig = {
  key: FieldKey;
  label: string;
  required?: boolean;
  multiline?: boolean;
  minRows?: number;
};

const fields: FieldConfig[] = [
  { key: "title", label: "Título", required: true },
  { key: "author", label: "Autor" },
  { key: "synopsis", label: "Sinopsis", multiline: true, minRows: 3 },
];

type BookEditorMetadataTabProps = {
  formState: MetadataFormState;
  onFieldChange: (field: FieldKey, value: string) => void;
  disabled: boolean;
};

export function BookEditorMetadataTab({
  formState,
  onFieldChange,
  disabled,
}: BookEditorMetadataTabProps) {
  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <TextField
          key={field.key}
          label={field.label}
          value={formState[field.key]}
          onChange={(event) => onFieldChange(field.key, event.target.value)}
          required={field.required}
          multiline={field.multiline}
          minRows={field.minRows}
          disabled={disabled}
        />
      ))}
    </Stack>
  );
}
