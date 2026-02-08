import { presets } from "../presets";


type PresetName = keyof typeof presets;

export class PresetService {

    public getAll(): Record<PresetName, any> {
        return presets
    }

    public getByFramework(framework: string): Record<PresetName, any> {
        const filteredPresets: Record<PresetName, any> = {}

        for (const [name, preset] of Object.entries(presets) as [PresetName, any][]) {
            if (preset.framework === framework) {
                filteredPresets[name] = preset
            }
        }

        return filteredPresets
    }


    public get(name: PresetName): any {
        return presets[name]
    }

    

}