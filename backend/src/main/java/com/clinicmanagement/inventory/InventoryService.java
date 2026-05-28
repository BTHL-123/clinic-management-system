package com.clinicmanagement.inventory;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.inventory.dto.*;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface InventoryService {

    PageResponse<MedicineBatchResponse> getBatches(Long medicineId, String status, Pageable pageable);

    MedicineBatchResponse importBatch(ImportBatchRequest request, User currentUser);

    PageResponse<StockTransactionResponse> getTransactions(Long medicineId, String transactionType, Pageable pageable);

    StockTransactionResponse exportStock(ExportTransactionRequest request, User currentUser);

    PageResponse<MedicineStockAlertResponse> getActiveAlerts(Pageable pageable);

    void resolveAlert(Long alertId, User currentUser);

    void checkStockAlerts();

    void generateAlertsOnDemand();
}
