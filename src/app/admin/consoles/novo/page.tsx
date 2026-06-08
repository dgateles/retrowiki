import { DeviceForm } from "@/components/admin/device-form";

export default function NewConsolePage() {
  return (
    <>
      <h1 className="page__title">Novo console</h1>
      <p className="page__note">Preencha os dados. O slug é gerado pelo nome se ficar vazio.</p>
      <div className="mt-6">
        <DeviceForm />
      </div>
    </>
  );
}
