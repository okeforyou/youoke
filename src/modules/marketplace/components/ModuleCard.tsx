import { ModuleDefinition } from '@/modules/marketplace/types';
import { useModule } from '@/hooks/useModule';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';

interface ModuleCardProps {
    module: ModuleDefinition;
    onInstall?: (moduleId: string) => void;
}

export default function ModuleCard({ module, onInstall }: ModuleCardProps) {
    const { hasModule, isLoading } = useModule(module.id);
    const { user } = useAuthStore();
    const isFree = module.pricing.tier === 'free';
    const Icon = module.icon;

    const handleInstallClick = async () => {
        if (!onInstall && !module.pricing.priceTHB) return;

        // If free, just callback (StorePage handles logic)
        // If paid, we need to trigger the payment flow here OR let the parent handle it.
        // Let's defer to parent `handlInstall` for now, but in future this could be self-contained.
        onInstall && onInstall(module.id);
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-all duration-300">
            <div className="card-body">
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary mb-4">
                        {Icon && <Icon className="w-8 h-8" />}
                    </div>
                    {hasModule ? (
                        <div className="badge badge-success gap-1 text-white">
                            <CheckCircleIcon className="w-3 h-3" />
                            Installed
                        </div>
                    ) : (
                        <div className={`badge ${isFree ? 'badge-ghost' : 'badge-warning'} gap-1`}>
                            {isFree ? 'Free' : `${module.pricing.priceTHB} THB`}
                        </div>
                    )}
                </div>

                <h2 className="card-title text-lg">{module.name}</h2>
                <p className="text-sm text-gray-500 min-h-[40px]">{module.description}</p>

                <div className="card-actions justify-end mt-4">
                    {hasModule ? (
                        <button className="btn btn-sm btn-disabled w-full">Already Owned</button>
                    ) : (
                        <button
                            className={`btn btn-sm w-full ${isFree ? 'btn-primary' : 'btn-outline'}`}
                            onClick={handleInstallClick}
                            disabled={isLoading || !user}
                        >
                            {isFree ? 'Get It Now' : 'Purchase (Mock)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
