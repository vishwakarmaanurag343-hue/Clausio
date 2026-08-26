using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Clausio.Legal.Core.Interfaces.Memory;

public interface IContextEngine
{
    Task<string> BuildChatContextAsync(Guid caseId, string userQuery, CancellationToken cancellationToken = default);
    Task<string> BuildDraftingContextAsync(Guid caseId, string documentType, string specificInstructions, CancellationToken cancellationToken = default);
    Task<string> BuildAnalysisContextAsync(Guid caseId, string analysisType, CancellationToken cancellationToken = default);

    /// <summary>Grounds financial extraction in the case's uploaded FINANCIAL documents only (bank statements, ITRs, salary slips, invoices…).</summary>
    Task<string> BuildFinancialContextAsync(Guid caseId, CancellationToken cancellationToken = default);
}
