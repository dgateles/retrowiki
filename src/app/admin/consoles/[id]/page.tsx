import { notFound } from "next/navigation";
import { getDeviceForEdit } from "@/lib/admin/devices";
import { DeviceForm } from "@/components/admin/device-form";

export default async function EditConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const device = await getDeviceForEdit(Number(id));
  if (!device) notFound();

  return (
    <>
      <h1 className="page__title">Editar console</h1>
      <p className="page__note">{device.name}</p>
      <div className="mt-6">
        <DeviceForm initial={device} />
      </div>
    </>
  );
}
