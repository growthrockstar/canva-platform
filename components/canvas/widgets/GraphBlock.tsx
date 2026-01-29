"use client";

import React, { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { Settings } from "lucide-react";
import type { Widget } from '@/types/canvas';
import { useCanvasStore } from '@/lib/store/useCanvasStore';
import { Button } from '@/components/ui/Button';
import { sheetEngine } from '@/lib/sheetEngine';

interface GraphBlockProps {
    widget: Widget;
    onUpdate: (data: Partial<Widget>) => void;
}

const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
];

export const GraphBlock: React.FC<GraphBlockProps> = ({ widget, onUpdate }) => {
    const { syllabus_sections } = useCanvasStore();
    const [isConfiguring, setIsConfiguring] = useState(
        !widget.graphConfig?.tableId,
    );

    // 1. Find all available table widgets
    const availableTables = useMemo(() => {
        const tables: { id: string; title: string; data: string[][] }[] = [];
        syllabus_sections.forEach((section) => {
            const findTables = (widgets: Widget[]) => {
                widgets.forEach((w) => {
                    if (w.type === "table" && w.tableData) {
                        // Try to find a meaningful title or use ID
                        tables.push({
                            id: w.id,
                            title: `Table in ${section.title}`, // Could improve if tables had titles
                            data: w.tableData,
                        });
                    }
                    if (w.children) findTables(w.children);
                });
            };
            findTables(section.widgets);
        });
        return tables;
    }, [syllabus_sections]);

    // 2. Get selected table data
    const selectedTable = useMemo(() => {
        if (!widget.graphConfig?.tableId) return null;
        return availableTables.find((t) => t.id === widget.graphConfig?.tableId);
    }, [widget.graphConfig?.tableId, availableTables]);

    const headers = selectedTable?.data[0] || [];

    // 3. Process data for Recharts
    const chartData = useMemo(() => {
        if (!selectedTable || !widget.graphConfig) return [];

        // Ensure engine is up to date
        // (In a real app, we might need a more robust subscription,
        // but since they share the same store/render cycle, passing data to engine here ensures it's fresh)
        sheetEngine.updateSheet(selectedTable.id, selectedTable.data);

        // Get COMPUTED data
        const computedData = sheetEngine.getComputedData(
            selectedTable.id,
            selectedTable.data.length,
            selectedTable.data[0].length,
        );
        const headers = computedData[0]; // Assuming headers are computed too? Usually they are static text but engine handles it.
        const dataRows = computedData.slice(1);

        const { xAxisColumn, dataColumns } = widget.graphConfig;

        return dataRows.map((row, rowIndex) => {
            const item: any = { name: row[xAxisColumn] || `Row ${rowIndex + 1}` };
            dataColumns.forEach((colIndex) => {
                const key = headers[colIndex] || `Col ${colIndex}`;
                // Try to parse number, remove % or currency symbols if simple
                let valStr = row[colIndex];
                if (valStr) {
                    valStr = valStr.replace(/[$,%]/g, "");
                }
                const val = parseFloat(valStr);
                item[key] = isNaN(val) ? 0 : val;
            });
            return item;
        });
    }, [selectedTable, widget.graphConfig]);

    // Handlers
    const handleSaveConfig = (config: any) => {
        onUpdate({ graphConfig: config });
        setIsConfiguring(false);
    };

    if (availableTables.length === 0) {
        return (
            <div className="p-8 border-2 border-dashed border-white/20 rounded-lg text-center text-white/50">
                <p>No hay tablas disponibles para crear un gráfico.</p>
                <p className="text-sm">Agrega un widget de Tabla primero.</p>
            </div>
        );
    }

    if (isConfiguring || !widget.graphConfig) {
        return (
            <div className="p-4 bg-gray-900/50 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-white">
                    Configurar Gráfico
                </h3>
                <ConfigForm
                    availableTables={availableTables}
                    initialConfig={widget.graphConfig}
                    onSave={handleSaveConfig}
                    onCancel={() => widget.graphConfig && setIsConfiguring(false)}
                />
            </div>
        );
    }

    return (
        <div className="relative group p-4 border border-white/5 rounded-lg bg-white/5">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsConfiguring(true)}
                >
                    <Settings className="w-4 h-4" />
                </Button>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart(
                        widget.graphConfig.chartType,
                        chartData,
                        widget.graphConfig.dataColumns,
                        headers,
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const renderChart = (
    type: string,
    data: any[],
    dataColumns: number[],
    headers: string[],
) => {
    const keys = dataColumns.map((i) => headers[i]);

    switch (type) {
        case "bar":
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            color: "#fff",
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {keys.map((key, i) => (
                        <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
                    ))}
                </BarChart>
            );
        case "line":
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            color: "#fff",
                        }}
                    />
                    <Legend />
                    {keys.map((key, i) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            );
        case "area":
            return (
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            color: "#fff",
                        }}
                    />
                    <Legend />
                    {keys.map((key, i) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            fill={COLORS[i % COLORS.length]}
                            stroke={COLORS[i % COLORS.length]}
                            fillOpacity={0.3}
                        />
                    ))}
                </AreaChart>
            );
        case "pie":
            // Pie charts usually show one data series vs labels
            const key = keys[0];
            return (
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={key}
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={{ fill: 'white', fontSize: 12 }}
                    >
                        {data.map((_entry: any, index: number) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="#1f2937" // Match background or similar for spacing
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            color: "#fff",
                        }}
                    />
                    <Legend />
                </PieChart>
            );
        default:
            return null;
    }
};

const ConfigForm = ({
    availableTables,
    initialConfig,
    onSave,
    onCancel,
}: any) => {
    const [tableId, setTableId] = useState(
        initialConfig?.tableId ||
        (availableTables.length > 0 ? availableTables[0].id : ""),
    );
    const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area">(
        initialConfig?.chartType || "bar",
    );

    // Derive columns from selected table
    const selectedTable = availableTables.find((t: any) => t.id === tableId);
    const headers = selectedTable?.data[0] || [];

    const [xAxisColumn, setXAxisColumn] = useState<number>(
        initialConfig?.xAxisColumn || 0,
    );
    const [dataColumns, setDataColumns] = useState<number[]>(
        initialConfig?.dataColumns || [1],
    );

    const handleSave = () => {
        onSave({
            tableId,
            chartType,
            xAxisColumn,
            dataColumns,
        });
    };

    const toggleDataColumn = (index: number) => {
        if (dataColumns.includes(index)) {
            if (dataColumns.length > 1)
                setDataColumns(dataColumns.filter((i) => i !== index));
        } else {
            setDataColumns([...dataColumns, index]);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Seleccionar Tabla
                </label>
                <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                >
                    {availableTables.map((t: any) => (
                        <option key={t.id} value={t.id}>
                            {t.title} (ID: {t.id.slice(0, 4)})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Tipo de Gráfico
                </label>
                <div className="flex gap-2">
                    {["bar", "line", "area", "pie"].map((type) => (
                        <Button
                            key={type}
                            variant={chartType === type ? "primary" : "secondary"}
                            onClick={() => setChartType(type as any)}
                            size="sm"
                        >
                            {type.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Eje X (Etiquetas)
                    </label>
                    <select
                        value={xAxisColumn}
                        onChange={(e) => setXAxisColumn(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                    >
                        {headers.map((h: string, i: number) => (
                            <option key={i} value={i}>
                                {h}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Datos (Series)
                    </label>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {headers.map((h: string, i: number) => (
                            <label
                                key={i}
                                className="flex items-center gap-2 text-sm text-gray-300"
                            >
                                <input
                                    type="checkbox"
                                    checked={dataColumns.includes(i)}
                                    onChange={() => toggleDataColumn(i)}
                                    disabled={xAxisColumn === i} // Can't be both X and Data usually
                                />
                                {h}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button onClick={handleSave}>Guardar Configuración</Button>
            </div>
        </div>
    );
};
