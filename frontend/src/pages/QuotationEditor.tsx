import {
	Archive,
	Building2,
	Calculator,
	Calendar,
	Eye,
	FileText,
	Plus,
	Receipt,
	Truck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../api";
import { AiAssistant } from "../components/ai/AiAssistant";
import { useQuotationStore } from "../store/quotationStore";
import { generateLivePreviewHtml } from "../utils/template";

export const QuotationEditor: React.FC = () => {
	const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
	const [savingHistory, setSavingHistory] = useState(false);
	const [generatingPdf, setGeneratingPdf] = useState(false);

	const state = useQuotationStore();

	// Fetch the real next sequential quote number from backend on first load
	useEffect(() => {
		state.fetchAndSetNextQuoteNumber();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Handle generic native input mapping to Zustand reactive setters
	const handleTextChange = (field: any, val: string) => {
		state.updateForm({ [field]: val });
	};

	const handleNumChange = (field: any, val: number) => {
		state.updateForm({ [field]: val });
	};

	// Convert uploaded inline file images into Base64 format strings
	const handleItemPhotoUpload = (itemId: string, file: File | null) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			state.updateItem(itemId, "photo", result);
		};
		reader.readAsDataURL(file);
	};

	const handleGlobalPhotoUpload = (
		field: "companyLogo" | "authSignature",
		file: File | null,
	) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			state.updateForm({ [field]: result });
		};
		reader.readAsDataURL(file);
	};

	// Financial Summary calculations
	let calculatedSubtotal = 0;
	let calculatedTaxSum = 0;
	state.items.forEach((it) => {
		const amt = it.qty * it.rate;
		calculatedSubtotal += amt;
		calculatedTaxSum += amt * (it.tax / 100);
	});

	const grandTotal = calculatedSubtotal + calculatedTaxSum;

	const handleGeneratePdf = async () => {
		setGeneratingPdf(true);
		try {
			// Gather comprehensive snapshot state variables
			const payload = {
				quoteNumber: state.quoteNumber,
				quoteDate: state.quoteDate,
				validTill: state.validTill,
				quoteTitle: state.quoteTitle,
				projectName: state.projectName,
				custRef: state.custRef,
				transport: state.transport,

				billName: state.billName,
				billContact: state.billContact,
				billAddr: state.billAddr,
				billPhone: state.billPhone,
				billEmail: state.billEmail,
				billState: state.billState,
				billStateCode: state.billStateCode,

				sameAsBill: state.sameAsBill,
				shipName: state.shipName,
				shipContact: state.shipContact,
				shipAddr: state.shipAddr,
				shipPhone: state.shipPhone,
				shipEmail: state.shipEmail,
				shipState: state.shipState,
				shipStateCode: state.shipStateCode,

				freightType: state.freightType,
				freightAmt: state.freightAmt,
				instType: state.instType,
				taxType: state.taxType,

				payTerms: state.payTerms,
				delivTime: state.delivTime,
				warranty: state.warranty,
				warrantyStart: state.warrantyStart,
				companyLogo: state.companyLogo,
				authSignature: state.authSignature,

				items: state.items,
				isDocComposite: state.isDocComposite,
			};

			await api.generatePreviewPdf(payload);
			state.setToast("Native PDF Stream Generated & Displayed.");
		} catch (error: any) {
			state.setToast(
				error.message || "Error executing dynamic PDF stream mapping.",
				"warn",
			);
		} finally {
			setGeneratingPdf(false);
		}
	};

	const handleSaveToHistory = async () => {
		if (!state.billName.trim()) {
			state.setToast(
				"Please input a valid Customer Billing Company Name first.",
				"warn",
			);
			return;
		}

		setSavingHistory(true);
		try {
			const payload = {
				quoteNumber: state.quoteNumber,
				quoteDate: state.quoteDate,
				validTill: state.validTill,
				quoteTitle: state.quoteTitle,
				projectName: state.projectName,
				custRef: state.custRef,
				transport: state.transport,

				billName: state.billName,
				billContact: state.billContact,
				billAddr: state.billAddr,
				billPhone: state.billPhone,
				billEmail: state.billEmail,
				billState: state.billState,
				billStateCode: state.billStateCode,

				sameAsBill: state.sameAsBill,
				shipName: state.shipName,
				shipContact: state.shipContact,
				shipAddr: state.shipAddr,
				shipPhone: state.shipPhone,
				shipEmail: state.shipEmail,
				shipState: state.shipState,
				shipStateCode: state.shipStateCode,

				freightType: state.freightType,
				freightAmt: state.freightAmt,
				instType: state.instType,
				taxType: state.taxType,

				payTerms: state.payTerms,
				delivTime: state.delivTime,
				warranty: state.warranty,
				warrantyStart: state.warrantyStart,
				companyLogo: state.companyLogo,
				authSignature: state.authSignature,

				items: state.items,
				isDocComposite: state.isDocComposite,
				status: "saved",
				customEmailSubject: state.customEmailSubject || undefined,
				customEmailBody: state.customEmailBody || undefined,
			};

			await api.saveQuotation(payload);

			state.setToast(
				"Archived safely into PostgreSQL backend & initiated automated tracker!",
				"success",
			);
			// Refresh the quote number to the next sequential value for the next new quotation
			state.fetchAndSetNextQuoteNumber();
		} catch (error: any) {
			// Fallback gracefully to simple browser history
			try {
				const legacyHist = JSON.parse(
					localStorage.getItem("kb_history") || "[]",
				);
				legacyHist.unshift({
					id: String(Date.now()),
					quoteNo: state.quoteNumber,
					custName: state.billName,
					custEmail: state.billEmail,
					total: grandTotal,
					savedAt: new Date().toISOString(),
					...state,
				});
				localStorage.setItem("kb_history", JSON.stringify(legacyHist));

				state.setToast("Archived to local browser DB storage as standby.");
			} catch {
				state.setToast("Failed to persist historical archive state.", "warn");
			}
		} finally {
			setSavingHistory(false);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
			{/* LEFT COLUMN: Comprehensive Dynamic Document Form Controls (Span 2) */}
			<div className="lg:col-span-2 space-y-6">
				{/* Top Tab Toggle Strip */}
				<div className="p-1.5 bg-gray-200/80 rounded-xl flex items-center gap-1 max-w-md mx-auto">
					<button
						onClick={() => setActiveTab("edit")}
						className={`flex-1 py-2 rounded-lg font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
							activeTab === "edit"
								? "bg-white text-brand-900 shadow-sm"
								: "text-gray-600 hover:text-brand-900"
						}`}>
						<FileText className="w-3.5 h-3.5" /> 📝 Edit Parameters
					</button>
					<button
						onClick={() => setActiveTab("preview")}
						className={`flex-1 py-2 rounded-lg font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
							activeTab === "preview"
								? "bg-brand-900 text-white shadow-sm"
								: "text-gray-600 hover:text-brand-900"
						}`}>
						<Eye className="w-3.5 h-3.5" /> 👁️ Live Preview
					</button>
				</div>

				{activeTab === "preview" ? (
					<div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm animate-fadeIn">
						<div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between rounded-t-xl mb-2">
							<span className="text-xs font-bold text-gray-500">
								Live Handlebars A4 Preview Stream
							</span>
							<span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
								Auto-sync active
							</span>
						</div>
						<iframe
							srcDoc={generateLivePreviewHtml(state)}
							className="w-full h-[950px] rounded-xl border-0"
							title="Real-Time Document Preview"
						/>
					</div>
				) : (
					<div className="space-y-6 animate-fadeIn">
						{/* Card 1: Header Context Variables */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
							<div className="flex items-center gap-2 border-b border-gray-100 pb-3">
								<FileText className="w-4 h-4 text-brand-900" />
								<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
									Quotation Metadata Variables
								</h2>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Quote Reference Number
									</label>
									<input
										type="text"
										value={state.quoteNumber}
										onChange={(e) =>
											handleTextChange("quoteNumber", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-400"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Creation Date
									</label>
									<input
										type="date"
										value={state.quoteDate}
										onChange={(e) =>
											handleTextChange("quoteDate", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-400"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Validity Guarantee
									</label>
									<input
										type="date"
										value={state.validTill}
										onChange={(e) =>
											handleTextChange("validTill", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-400"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Subject Title Banner
									</label>
									<input
										type="text"
										value={state.quoteTitle}
										onChange={(e) =>
											handleTextChange("quoteTitle", e.target.value)
										}
										placeholder="e.g. Commercial Proposal for Modbus Sensors"
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Specific Project Target
									</label>
									<input
										type="text"
										value={state.projectName}
										onChange={(e) =>
											handleTextChange("projectName", e.target.value)
										}
										placeholder="Optional project identifier name"
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Client Reference / RFQ ID
									</label>
									<input
										type="text"
										value={state.custRef}
										onChange={(e) =>
											handleTextChange("custRef", e.target.value)
										}
										placeholder="Customer Reference ID/Email date"
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Transit / Freight Carrier
									</label>
									<input
										type="text"
										value={state.transport}
										onChange={(e) =>
											handleTextChange("transport", e.target.value)
										}
										placeholder="By road / DTDC courier"
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>
							</div>
						</div>

						{/* Card 1B: Custom Branding & Visual Identity Uploaders */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
							<div className="flex items-center justify-between border-b border-gray-100 pb-3">
								<div className="flex items-center gap-2">
									<span className="text-base">✨</span>
									<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
										Company Branding &amp; Signature Identity
									</h2>
								</div>
								<span className="text-[10px] text-gray-400 font-mono">
									Optional high-fidelity asset overrides
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Custom Logo Override */}
								<div className="p-3 bg-gray-50/60 rounded-xl border border-gray-200 flex items-center gap-3 relative group">
									<div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
										{state.companyLogo ? (
											<img
												src={state.companyLogo}
												alt="Company Logo"
												className="w-full h-full object-contain p-0.5"
											/>
										) : (
											<span className="text-[9px] font-bold text-gray-400 text-center leading-tight">
												No Logo
											</span>
										)}
									</div>
									<div className="flex-1">
										<span className="block text-xs font-bold text-gray-800">
											Custom Company Logo
										</span>
										<span className="text-[10px] text-gray-500 block">
											Replaces standard text header
										</span>
										<label className="mt-1 inline-block text-[10px] font-extrabold text-brand-900 bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:border-brand-400">
											Browse File
											<input
												type="file"
												accept="image/*"
												onChange={(e) =>
													handleGlobalPhotoUpload(
														"companyLogo",
														e.target.files?.[0] || null,
													)
												}
												className="hidden"
											/>
										</label>
									</div>
									{state.companyLogo && (
										<button
											onClick={() => state.updateForm({ companyLogo: null })}
											className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 font-bold text-xs"
											title="Clear custom logo">
											&times;
										</button>
									)}
								</div>

								{/* Authorized Signature Upload */}
								<div className="p-3 bg-gray-50/60 rounded-xl border border-gray-200 flex items-center gap-3 relative group">
									<div className="w-24 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
										{state.authSignature ? (
											<img
												src={state.authSignature}
												alt="Authorized Signature"
												className="w-full h-full object-contain p-0.5"
											/>
										) : (
											<span className="text-[9px] font-bold text-gray-400 text-center leading-tight">
												No Sign
											</span>
										)}
									</div>
									<div className="flex-1">
										<span className="block text-xs font-bold text-gray-800">
											Authorized Signature
										</span>
										<span className="text-[10px] text-gray-500 block">
											Renders transparently above footer
										</span>
										<label className="mt-1 inline-block text-[10px] font-extrabold text-brand-900 bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:border-brand-400">
											Browse File
											<input
												type="file"
												accept="image/*"
												onChange={(e) =>
													handleGlobalPhotoUpload(
														"authSignature",
														e.target.files?.[0] || null,
													)
												}
												className="hidden"
											/>
										</label>
									</div>
									{state.authSignature && (
										<button
											onClick={() => state.updateForm({ authSignature: null })}
											className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 font-bold text-xs"
											title="Clear signature image">
											&times;
										</button>
									)}
								</div>
							</div>
						</div>

						{/* Card 2: Customer / CRM Parameters */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
							<div className="flex items-center gap-2 border-b border-gray-100 pb-3">
								<Building2 className="w-4 h-4 text-brand-900" />
								<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
									Customer Identification Entity
								</h2>
							</div>

							{/* Billed To */}
							<div className="space-y-3">
								<h3 className="text-xs font-black text-brand-900">
									Billed To (Receiver Entity):
								</h3>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											Company Entity Name
										</label>
										<input
											type="text"
											value={state.billName}
											onChange={(e) =>
												handleTextChange("billName", e.target.value)
											}
											placeholder="M/s Industrial Enterprise Ltd."
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-400"
										/>
									</div>

									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											Contact Attn / Representative
										</label>
										<input
											type="text"
											value={state.billContact}
											onChange={(e) =>
												handleTextChange("billContact", e.target.value)
											}
											placeholder="Mr. Director / Purchasing Manager"
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
										/>
									</div>
								</div>

								<div>
									<label className="block text-[11px] font-bold text-gray-500 mb-1">
										Complete Billing Address
									</label>
									<textarea
										rows={2}
										value={state.billAddr}
										onChange={(e) =>
											handleTextChange("billAddr", e.target.value)
										}
										placeholder="Plot No., Industrial Pocket, District City - Pincode"
										className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white resize-y"
									/>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											Phone String
										</label>
										<input
											type="text"
											value={state.billPhone}
											onChange={(e) =>
												handleTextChange("billPhone", e.target.value)
											}
											placeholder="+91 XXXXXXXXXX"
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
										/>
									</div>

									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											Email Endpoint
										</label>
										<input
											type="email"
											value={state.billEmail}
											onChange={(e) =>
												handleTextChange("billEmail", e.target.value)
											}
											placeholder="buyer@domain.com"
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
										/>
									</div>

									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											GST State Name
										</label>
										<input
											type="text"
											value={state.billState}
											onChange={(e) =>
												handleTextChange("billState", e.target.value)
											}
											placeholder="e.g. Telangana"
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
										/>
									</div>

									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											State Code Num
										</label>
										<input
											type="text"
											value={state.billStateCode}
											onChange={(e) =>
												handleTextChange("billStateCode", e.target.value)
											}
											placeholder="36"
											className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white text-center"
										/>
									</div>
								</div>
							</div>

							{/* Consignee Toggle Row */}
							<div className="pt-3 border-t border-gray-100 flex items-center justify-between">
								<div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
									<Truck className="w-4 h-4 text-brand-700" />
									<span>Consignee Details (Ship To):</span>
								</div>

								<label className="inline-flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={state.sameAsBill}
										onChange={(e) =>
											state.updateForm({ sameAsBill: e.target.checked })
										}
										className="w-4 h-4 rounded text-brand-900 focus:ring-brand-500 accent-brand-900 cursor-pointer"
									/>
									<span className="text-xs font-bold text-brand-900 select-none">
										Same as Billing Address
									</span>
								</label>
							</div>

							{/* Dynamic Ship To Fields */}
							{!state.sameAsBill && (
								<div className="space-y-3 pt-2 pl-4 border-l-2 border-brand-200 animate-fadeIn">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												Shipping Entity Name
											</label>
											<input
												type="text"
												value={state.shipName}
												onChange={(e) =>
													handleTextChange("shipName", e.target.value)
												}
												placeholder="M/s Target Logistics Hub"
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white"
											/>
										</div>

										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												Shipping Contact
											</label>
											<input
												type="text"
												value={state.shipContact}
												onChange={(e) =>
													handleTextChange("shipContact", e.target.value)
												}
												placeholder="Site Automation Engineer"
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
											/>
										</div>
									</div>

									<div>
										<label className="block text-[11px] font-bold text-gray-500 mb-1">
											Complete Delivery Address
										</label>
										<textarea
											rows={2}
											value={state.shipAddr}
											onChange={(e) =>
												handleTextChange("shipAddr", e.target.value)
											}
											placeholder="Plot/Factory floor destination"
											className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white resize-y"
										/>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												Phone
											</label>
											<input
												type="text"
												value={state.shipPhone}
												onChange={(e) =>
													handleTextChange("shipPhone", e.target.value)
												}
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
											/>
										</div>

										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												Email
											</label>
											<input
												type="email"
												value={state.shipEmail}
												onChange={(e) =>
													handleTextChange("shipEmail", e.target.value)
												}
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
											/>
										</div>

										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												State
											</label>
											<input
												type="text"
												value={state.shipState}
												onChange={(e) =>
													handleTextChange("shipState", e.target.value)
												}
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
											/>
										</div>

										<div>
											<label className="block text-[11px] font-bold text-gray-500 mb-1">
												Code
											</label>
											<input
												type="text"
												value={state.shipStateCode}
												onChange={(e) =>
													handleTextChange("shipStateCode", e.target.value)
												}
												className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white text-center"
											/>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Card 3: Dynamic Item Lines Row Manager */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-gray-100 pb-3">
								<div className="flex items-center gap-2">
									<Receipt className="w-4 h-4 text-brand-900" />
									<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
										Commercial Line Items Configuration
									</h2>
								</div>

								<div className="flex items-center gap-4">
									<label className="flex items-center gap-2 cursor-pointer group/toggle">
										<input
											type="checkbox"
											checked={state.isDocComposite}
											onChange={(e) =>
												state.updateForm({ isDocComposite: e.target.checked })
											}
											className="w-4 h-4 rounded text-brand-900 focus:ring-brand-500 accent-brand-900 cursor-pointer"
										/>
										<span className="text-[10px] font-black uppercase tracking-wider text-brand-900 group-hover/toggle:text-brand-700 transition-colors">
											Composite Format
										</span>
									</label>
									<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-900 border border-brand-100">
										Total Lines: {state.items.length}
									</span>
								</div>
							</div>

							<div className="space-y-3">
								{state.items.map((it, idx) => {
									const lineAmt = it.qty * it.rate;

									return (
										<div
											key={it.id}
											className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 transition-all flex flex-col sm:flex-row gap-3 items-start relative group">
											<div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white font-black text-xs text-brand-900 border border-gray-200/80 shrink-0 mt-1">
												{idx + 1}
											</div>

											{/* Photo Uploader Primitive */}
											<div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 relative overflow-hidden group/img mt-1">
												{it.photo ? (
													<img
														src={it.photo}
														alt="Item thumbnail"
														className="w-full h-full object-contain p-1"
													/>
												) : (
													<span className="text-[10px] font-bold text-gray-400 text-center leading-tight p-1 select-none">
														Upload Image
													</span>
												)}

												<input
													type="file"
													accept="image/*"
													onChange={(e) =>
														handleItemPhotoUpload(
															it.id,
															e.target.files?.[0] || null,
														)
													}
													className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
													title="Upload sensor custom thumbnail file"
												/>

												{it.photo && (
													<button
														onClick={() =>
															state.updateItem(it.id, "photo", null)
														}
														className="absolute inset-0 bg-brand-950/70 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
														Remove
													</button>
												)}
											</div>

											{/* Line Variables */}
											<div className="flex-1 w-full space-y-2">
												<textarea
													rows={3}
													value={it.description}
													onChange={(e) =>
														state.updateItem(
															it.id,
															"description",
															e.target.value,
														)
													}
													placeholder="Line 1: Item header name string&#10;Line 2+: Parameters & technical specs list"
													className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-brand-400 leading-relaxed font-mono resize-y"
												/>

												<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
													<div>
														<input
															type="text"
															placeholder="HSN Code"
															value={it.hsn}
															onChange={(e) =>
																state.updateItem(it.id, "hsn", e.target.value)
															}
															className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-brand-400 text-center font-mono"
														/>
													</div>

													<div>
														<div className="relative">
															<span className="absolute left-2 top-1.5 text-[10px] font-bold text-gray-400 pointer-events-none">
																Qty:
															</span>
															<input
																type="number"
																min="1"
																value={it.qty}
																onChange={(e) =>
																	state.updateItem(
																		it.id,
																		"qty",
																		parseFloat(e.target.value) || 1,
																	)
																}
																className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-400 text-right"
															/>
														</div>
													</div>

													<div>
														<div className="relative">
															<span className="absolute left-2 top-1.5 text-[10px] font-bold text-gray-400 pointer-events-none">
																Rate:
															</span>
															<input
																type="number"
																min="0"
																step="0.01"
																value={it.rate}
																onChange={(e) =>
																	state.updateItem(
																		it.id,
																		"rate",
																		parseFloat(e.target.value) || 0,
																	)
																}
																className="w-full pl-9 pr-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-400 text-right"
															/>
														</div>
													</div>

													<div>
														<select
															value={it.tax}
															onChange={(e) =>
																state.updateItem(
																	it.id,
																	"tax",
																	parseFloat(e.target.value),
																)
															}
															className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-brand-400 text-center cursor-pointer">
															<option value="28">GST 28%</option>
															<option value="18">GST 18%</option>
															<option value="12">GST 12%</option>
															<option value="5">GST 5%</option>
															<option value="0">GST 0%</option>
														</select>
													</div>
												</div>
											</div>

											{/* Dynamic Line Amount & Delete Action */}
											<div className="flex sm:flex-col items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-1 pl-1">
												<div className="text-right">
													<span className="text-[9px] font-bold text-gray-400 block uppercase">
														Amount
													</span>
													<span className="font-extrabold text-xs text-brand-900 font-mono">
														₹
														{lineAmt.toLocaleString("en-IN", {
															minimumFractionDigits: 2,
														})}
													</span>
												</div>

												<button
													onClick={() => state.removeItem(it.id)}
													title="Remove Item Row"
													className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-white transition-colors mt-1">
													<span className="text-xs font-bold block sm:hidden">
														Remove Row
													</span>
													<span className="hidden sm:block font-black text-sm">
														&times;
													</span>
												</button>
											</div>
										</div>
									);
								})}
							</div>

							<button
								onClick={() => state.addItem()}
								className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 text-gray-500 hover:text-brand-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-gray-50/30 hover:bg-brand-50/20 active:scale-[0.99]">
								<Plus className="w-4 h-4 text-brand-700" /> Insert Automation
								Line Row
							</button>
						</div>

						{/* Card 4: Extra Charges & Slabs Config */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
							<div className="flex items-center gap-2 border-b border-gray-100 pb-3">
								<Calculator className="w-4 h-4 text-brand-900" />
								<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
									Commercial Tax Slabs &amp; Auxiliary Charges
								</h2>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Freight Transport Class
									</label>
									<select
										value={state.freightType}
										onChange={(e) =>
											state.updateForm({ freightType: e.target.value as any })
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white cursor-pointer">
										<option value="extra">Extra (as actuals)</option>
										<option value="included">Included in base quotation</option>
										<option value="custom">
											Custom configured numeric amount
										</option>
									</select>
								</div>

								{state.freightType === "custom" && (
									<div className="animate-fadeIn">
										<label className="block text-xs font-bold text-brand-900 mb-1">
											Freight Target Sum (₹)
										</label>
										<input
											type="number"
											min="0"
											value={state.freightAmt}
											onChange={(e) =>
												handleNumChange(
													"freightAmt",
													parseFloat(e.target.value) || 0,
												)
											}
											className="w-full px-3 py-2 rounded-xl bg-white border border-brand-200 text-xs font-bold text-brand-900 focus:outline-none focus:border-brand-500 text-right"
										/>
									</div>
								)}

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Installation Mandate
									</label>
									<select
										value={state.instType}
										onChange={(e) =>
											state.updateForm({ instType: e.target.value as any })
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white cursor-pointer">
										<option value="extra">Extra on per-diem site terms</option>
										<option value="included">
											Included in product rate sum
										</option>
									</select>
								</div>
							</div>

							<div className="pt-2">
								<label className="block text-xs font-bold text-gray-600 mb-2">
									GST Inter/Intra Sovereignty Class
								</label>

								<div className="grid grid-cols-2 gap-3 max-w-md">
									<label
										className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
											state.taxType === "igst"
												? "bg-brand-50 border-brand-300 shadow-sm"
												: "bg-white border-gray-200 hover:border-gray-300"
										}`}>
										<input
											type="radio"
											name="taxType"
											value="igst"
											checked={state.taxType === "igst"}
											onChange={() => state.updateForm({ taxType: "igst" })}
											className="w-4 h-4 text-brand-900 accent-brand-900 focus:ring-brand-500 cursor-pointer"
										/>
										<div>
											<span className="block font-black text-xs text-brand-900 leading-tight">
												IGST Full Slab
											</span>
											<span className="text-[10px] text-gray-400 font-medium">
												Inter-state delivery
											</span>
										</div>
									</label>

									<label
										className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
											state.taxType === "cgst"
												? "bg-brand-50 border-brand-300 shadow-sm"
												: "bg-white border-gray-200 hover:border-gray-300"
										}`}>
										<input
											type="radio"
											name="taxType"
											value="cgst"
											checked={state.taxType === "cgst"}
											onChange={() => state.updateForm({ taxType: "cgst" })}
											className="w-4 h-4 text-brand-900 accent-brand-900 focus:ring-brand-500 cursor-pointer"
										/>
										<div>
											<span className="block font-black text-xs text-brand-900 leading-tight">
												CGST + SGST Split
											</span>
											<span className="text-[10px] text-gray-400 font-medium">
												Intra-state (Uttarakhand)
											</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Card 5: Terms & Delivery Covenants */}
						<div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
							<div className="flex items-center gap-2 border-b border-gray-100 pb-3">
								<Calendar className="w-4 h-4 text-brand-900" />
								<h2 className="font-extrabold text-sm uppercase tracking-wide text-gray-900">
									Commercial Guarantee &amp; Warranties
								</h2>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Standard Payment Expectation
									</label>
									<input
										type="text"
										value={state.payTerms}
										onChange={(e) =>
											handleTextChange("payTerms", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Estimated Dispatch Velocity
									</label>
									<input
										type="text"
										value={state.delivTime}
										onChange={(e) =>
											handleTextChange("delivTime", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Commercial Instrument Warranty
									</label>
									<input
										type="text"
										value={state.warranty}
										onChange={(e) =>
											handleTextChange("warranty", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-gray-600 mb-1">
										Warranty Term Commences On
									</label>
									<input
										type="text"
										value={state.warrantyStart}
										onChange={(e) =>
											handleTextChange("warrantyStart", e.target.value)
										}
										className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:bg-white"
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* RIGHT COLUMN: Real-time calculation state panel & AI proxy controllers (Span 1) */}
			<div className="lg:col-span-1 space-y-6 sticky top-20">
				{/* Dynamic Calculation Output State Box */}
				<div className="p-6 rounded-2xl bg-white border-2 border-brand-900 shadow-md relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-900 via-emerald-600 to-amber-400"></div>

					<h3 className="font-black text-xs text-brand-900 uppercase tracking-widest mb-4 flex items-center justify-between">
						<span>Live Audit Ledger</span>
						<span className="text-[10px] text-gray-400 font-mono lowercase">
							实时核算
						</span>
					</h3>

					<div className="space-y-2.5 font-sans divide-y divide-gray-100/80">
						<div className="flex justify-between text-xs pt-1">
							<span className="text-gray-500 font-medium">Subtotal Output</span>
							<span className="font-black text-gray-800 font-mono">
								₹
								{calculatedSubtotal.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
								})}
							</span>
						</div>

						{state.taxType === "igst" ? (
							<div className="flex justify-between text-xs pt-2">
								<span className="text-gray-500 font-medium">
									IGST Full Slab
								</span>
								<span className="font-bold text-rose-700 font-mono">
									₹
									{calculatedTaxSum.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
									})}
								</span>
							</div>
						) : (
							<>
								<div className="flex justify-between text-xs pt-2">
									<span className="text-gray-500 font-medium">
										CGST Central Portion
									</span>
									<span className="font-bold text-amber-700 font-mono">
										₹
										{(calculatedTaxSum / 2).toLocaleString("en-IN", {
											minimumFractionDigits: 2,
										})}
									</span>
								</div>
								<div className="flex justify-between text-xs pt-2">
									<span className="text-gray-500 font-medium">
										SGST State Portion
									</span>
									<span className="font-bold text-amber-700 font-mono">
										₹
										{(calculatedTaxSum / 2).toLocaleString("en-IN", {
											minimumFractionDigits: 2,
										})}
									</span>
								</div>
							</>
						)}

						{state.freightType === "custom" && state.freightAmt > 0 && (
							<div className="flex justify-between text-xs pt-2">
								<span className="text-gray-500 font-medium">
									Auxiliary Config Freight
								</span>
								<span className="font-bold text-brand-700 font-mono">
									₹
									{state.freightAmt.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
									})}
								</span>
							</div>
						)}

						<div className="flex justify-between items-baseline pt-3 mt-2">
							<div>
								<span className="block font-black text-sm text-brand-900 uppercase tracking-tight">
									Grand Total Sum
								</span>
								<span className="text-[9px] text-gray-400 font-medium block">
									Commercial liability sum
								</span>
							</div>

							<span className="font-black text-xl text-brand-900 font-mono tracking-tight">
								₹
								{(
									grandTotal +
									(state.freightType === "custom" ? state.freightAmt : 0)
								).toLocaleString("en-IN", {
									minimumFractionDigits: 2,
								})}
							</span>
						</div>
					</div>

					{/* Core Controls Actions Strip */}
					<div className="pt-5 mt-4 border-t border-gray-100 space-y-2.5">
						<button
							onClick={handleGeneratePdf}
							disabled={generatingPdf}
							className="w-full py-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50">
							{generatingPdf ? (
								<span>Streaming PDF Engine...</span>
							) : (
								<>
									<FileText className="w-4 h-4" /> Export High-Fidelity PDF
								</>
							)}
						</button>

						<button
							onClick={handleSaveToHistory}
							disabled={savingHistory}
							className="w-full py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-brand-200 active:scale-[0.99] disabled:opacity-50">
							{savingHistory ? (
								<span>Registering Storage DB...</span>
							) : (
								<>
									<Archive className="w-4 h-4 text-brand-700" /> Save to
									PostgreSQL DB Archive
								</>
							)}
						</button>
					</div>
				</div>

				{/* Embedded Anthropic AI Server Proxy Assistant Panel */}
				<AiAssistant />
			</div>
		</div>
	);
};
