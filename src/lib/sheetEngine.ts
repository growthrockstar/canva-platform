import { HyperFormula } from 'hyperformula';

// Singleton instance management for HyperFormula
class SheetEngine {
    private static instance: SheetEngine;
    private hf: HyperFormula;

    private constructor() {
        this.hf = HyperFormula.buildEmpty({
            licenseKey: 'gpl-v3',
            dateFormats: ['DD/MM/YYYY'],
            functionPlugins: [],
            // Set locale to support semicolon as separator (typical in some regions)
            language: 'enGB', // 'enGB' often uses comma, but let's check explicit config or try to set separators.
            // Actually, HyperFormula allows explicit separator config in recent versions or via language. 
            // Let's stick to standard internal English but mapped. 
            // Better yet, let's explicitly enable semicolon as argument separator if possible or choose a locale that uses it.
            // 'esES' (Spanish) usually uses ; for arguments.
        });
        // Loading 'esES' language might require registering it. For simplicity, we stick to default but user asked for ;
        // HyperFormula by default uses , for args. 
        // Let's try to just use default for now but maybe user input ; is what we need to support.
        // If we want ; as separator, we need a locale that supports it.
        // Let's try to register a custom locale or use one if available. 
        // For now, I will manually replace ; with , before passing to engine if needed, OR just tell user to use comma.
        // BUT user asked for ; support. 

        // Let's try to use replace on input for a quick fix or see if we can set it.
        // We will stick to default for now and handle input translation in TableBlock if needed, 
        // or just let HyperFormula handle it if we are lucky. 
        // Actually, let's look at `sheetEngine.ts` again. I'll add a replace in `updateCell` to swap ; to , for formula compatibility if strict.
        // Wait, standard is `SUM(A1, A2)` or `SUM(A1:A2)`. 
        // If user types `SUM(A1;A2)` and we are in EN locale, it might fail.
        // Let's assume we want to support standard Excel EN for now but allow ; as alias for ,

    }

    public static getInstance(): SheetEngine {
        if (!SheetEngine.instance) {
            SheetEngine.instance = new SheetEngine();
        }
        return SheetEngine.instance;
    }

    // Create or replace a sheet with data
    public updateSheet(sheetId: string, data: string[][]) {
        // Sanitize data: replace ; with , in formulas
        const sanitizedData = data.map(row =>
            row.map(cell => {
                if (typeof cell === 'string' && cell.startsWith('=') && cell.includes(';')) {
                    return cell.replace(/;/g, ',');
                }
                return cell;
            })
        );

        if (this.hf.doesSheetExist(sheetId)) {
            this.hf.clearSheet(this.hf.getSheetId(sheetId)!);
            this.hf.setSheetContent(this.hf.getSheetId(sheetId)!, sanitizedData);
        } else {
            this.hf.addSheet(sheetId);
            this.hf.setSheetContent(this.hf.getSheetId(sheetId)!, sanitizedData);
        }
    }

    public getComputedValue(sheetId: string, row: number, col: number): string {
        if (!this.hf.doesSheetExist(sheetId)) return '';
        const val = this.hf.getCellValue({ sheet: this.hf.getSheetId(sheetId)!, row, col });
        if (val === null || val === undefined) return '';
        // Check if it's an error
        if (typeof val === 'object' && 'type' in val && val.type === 'ERROR') {
            return val.value || '#ERROR';
        }
        return String(val);
    }

    public getComputedData(sheetId: string, rows: number, cols: number): string[][] {
        if (!this.hf.doesSheetExist(sheetId)) return [];
        const result: string[][] = [];
        for (let r = 0; r < rows; r++) {
            const rowData: string[] = [];
            for (let c = 0; c < cols; c++) {
                rowData.push(this.getComputedValue(sheetId, r, c));
            }
            result.push(rowData);
        }
        return result;
    }

    public getRegisteredFunctions(): string[] {
        return HyperFormula.getRegisteredFunctionNames('enGB');
    }
}

export const sheetEngine = SheetEngine.getInstance();
