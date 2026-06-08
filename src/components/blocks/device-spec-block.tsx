import { getDeviceDetailById } from "@/lib/devices";
import { DeviceSpecCard } from "@/components/catalog/device-spec-card";

export async function DeviceSpecBlock({ deviceId }: { deviceId: number }) {
  const detail = await getDeviceDetailById(deviceId);
  if (!detail) return null;
  return (
    <div className="my-6">
      <DeviceSpecCard detail={detail} />
    </div>
  );
}
