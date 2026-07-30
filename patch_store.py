import re

with open('src/stores/useAIVocalStore.ts', 'r') as f:
    content = f.read()

# Add rapidapiQuota to interface
if 'rapidapiQuota:' not in content:
    content = content.replace(
        'rapidapiKey: string | null;',
        'rapidapiKey: string | null;\n    rapidapiQuota: { remaining: number; limit: number } | null;'
    )

# Add rapidapiQuota to initial state
if 'rapidapiQuota: null,' not in content:
    content = content.replace(
        'rapidapiKey: null,',
        'rapidapiKey: null,\n    rapidapiQuota: null,'
    )

# Update checkBridgeStatus to parse quota
check_bridge = """    checkBridgeStatus: async () => {
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) {
                set({ isBridgeConnected: false });
                return;
            }
            const res = await fetch(`${baseUrl}/health`);
            if (res.ok) {
                const data = await res.json();
                set({ 
                    isBridgeConnected: true,
                    rapidapiQuota: data.quota && data.quota.remaining !== null ? data.quota : get().rapidapiQuota
                });
            } else {
                set({ isBridgeConnected: false });
            }
        } catch (e) {
            set({ isBridgeConnected: false });
        }
    },"""
content = re.sub(r'    checkBridgeStatus: async \(\) => \{.*?\},', check_bridge, content, flags=re.DOTALL)

with open('src/stores/useAIVocalStore.ts', 'w') as f:
    f.write(content)
