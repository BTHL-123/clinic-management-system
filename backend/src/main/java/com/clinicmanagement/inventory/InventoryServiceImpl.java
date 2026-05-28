package com.clinicmanagement.inventory;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.inventory.dto.*;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final MedicineBatchRepository batchRepository;
    private final StockTransactionRepository transactionRepository;
    private final MedicineStockAlertRepository alertRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicineBatchResponse> getBatches(Long medicineId, String status, Pageable pageable) {
        Page<MedicineBatch> page = batchRepository.findBatches(medicineId, status, pageable);
        return PageResponse.from(page.map(this::mapToBatchResponse));
    }

    @Transactional
    @Override
    public MedicineBatchResponse importBatch(ImportBatchRequest request, User currentUser) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found"));

        // Validate: reject if batch has already expired
        if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Không thể nhập lô thuốc đã hết hạn (HSD: " + request.getExpiryDate() + ")");
        }

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        }

        MedicineBatch batch = new MedicineBatch();
        batch.setMedicine(medicine);
        batch.setSupplier(supplier);
        batch.setBatchNumber(request.getBatchNumber());
        batch.setManufactureDate(request.getManufactureDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setImportPrice(request.getImportPrice());
        batch.setSellingPrice(request.getSellingPrice());
        batch.setInitialQuantity(request.getQuantity());
        batch.setCurrentQuantity(request.getQuantity());
        batch.setStatus("AVAILABLE");
        batch.setImportedBy(currentUser);

        MedicineBatch savedBatch = batchRepository.save(batch);

        StockTransaction transaction = new StockTransaction();
        transaction.setMedicine(medicine);
        transaction.setBatch(savedBatch);
        transaction.setTransactionType("IMPORT");
        transaction.setQuantity(request.getQuantity());
        transaction.setReferenceType("SUPPLIER_IMPORT");
        transaction.setCreatedBy(currentUser);
        transactionRepository.save(transaction);

        return mapToBatchResponse(savedBatch);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<StockTransactionResponse> getTransactions(Long medicineId, String transactionType, Pageable pageable) {
        Page<StockTransaction> page = transactionRepository.findTransactions(medicineId, transactionType, pageable);
        return PageResponse.from(page.map(this::mapToTransactionResponse));
    }

    @Transactional
    @Override
    public StockTransactionResponse exportStock(ExportTransactionRequest request, User currentUser) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found"));
        
        MedicineBatch batch = null;
        if (request.getBatchId() != null) {
            batch = batchRepository.findById(request.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
            
            if (batch.getCurrentQuantity() < request.getQuantity()) {
                throw new BusinessException("Not enough quantity in batch");
            }
            batch.setCurrentQuantity(batch.getCurrentQuantity() - request.getQuantity());
            if (batch.getCurrentQuantity() == 0) {
                batch.setStatus("OUT_OF_STOCK");
            }
            batchRepository.save(batch);
        } else {
            // Complex logic to deduct from oldest batches first could be added here
            // For simplicity, we assume batchId is required for direct exports right now
            throw new BusinessException("Batch ID is required for export");
        }

        StockTransaction transaction = new StockTransaction();
        transaction.setMedicine(medicine);
        transaction.setBatch(batch);
        transaction.setTransactionType("EXPORT");
        transaction.setQuantity(request.getQuantity());
        transaction.setReferenceType("MANUAL");
        transaction.setNote(request.getNote());
        transaction.setCreatedBy(currentUser);
        
        StockTransaction saved = transactionRepository.save(transaction);
        return mapToTransactionResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicineStockAlertResponse> getActiveAlerts(Pageable pageable) {
        Page<MedicineStockAlert> page = alertRepository.findByIsResolvedFalse(pageable);
        return PageResponse.from(page.map(this::mapToAlertResponse));
    }

    @Transactional
    @Override
    public void resolveAlert(Long alertId, User currentUser) {
        MedicineStockAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setIsResolved(true);
        alert.setResolvedBy(currentUser);
        alert.setResolvedAt(LocalDateTime.now());
        alertRepository.save(alert);
    }

    // Runs every day at 00:00 to check for stock alerts
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    @Override
    public void checkStockAlerts() {
        LocalDate today = LocalDate.now();
        List<MedicineBatch> allActiveBatches = batchRepository.findAll();
        
        for (MedicineBatch batch : allActiveBatches) {
            if ("OUT_OF_STOCK".equals(batch.getStatus()) || "EXPIRED".equals(batch.getStatus())) {
                continue;
            }
            
            if (batch.getCurrentQuantity() <= 10) {
                createAlert(batch, "LOW_STOCK", "Stock is critically low: " + batch.getCurrentQuantity());
                if (batch.getCurrentQuantity() == 0) {
                    batch.setStatus("OUT_OF_STOCK");
                } else {
                    batch.setStatus("LOW_STOCK");
                }
            }

            if (batch.getExpiryDate().isBefore(today)) {
                createAlert(batch, "EXPIRED", "Batch has expired on " + batch.getExpiryDate());
                batch.setStatus("EXPIRED");
            } else if (batch.getExpiryDate().isBefore(today.plusDays(30))) {
                createAlert(batch, "NEAR_EXPIRY", "Batch is expiring soon on " + batch.getExpiryDate());
            }
        }
    }

    /**
     * Generate alerts on-demand for all batches.
     * This method can be called anytime (e.g., when loading the alert dashboard)
     * to ensure alerts are up-to-date without waiting for the midnight CronJob.
     * 
     * Unlike checkStockAlerts(), this method checks for existing alerts before creating new ones
     * to prevent duplicates.
     */
    @Transactional
    @Override
    public void generateAlertsOnDemand() {
        LocalDate today = LocalDate.now();
        List<MedicineBatch> allBatches = batchRepository.findAll();
        
        for (MedicineBatch batch : allBatches) {
            // Skip batches that are already marked as OUT_OF_STOCK or EXPIRED in DB
            // (though we compute status dynamically, we still respect DB status for some logic)
            
            // Check EXPIRED
            if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today)) {
                createAlertIfNotExists(batch, "EXPIRED", 
                    "Lô thuốc " + batch.getBatchNumber() + " đã hết hạn vào ngày " + batch.getExpiryDate());
            }
            // Check NEAR_EXPIRY (within 30 days)
            else if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today.plusDays(30))) {
                createAlertIfNotExists(batch, "NEAR_EXPIRY",
                    "Lô thuốc " + batch.getBatchNumber() + " sắp hết hạn vào ngày " + batch.getExpiryDate());
            }
            
            // Check LOW_STOCK (quantity <= 10)
            if (batch.getCurrentQuantity() <= 10 && batch.getCurrentQuantity() > 0) {
                createAlertIfNotExists(batch, "LOW_STOCK",
                    "Lô thuốc " + batch.getBatchNumber() + " sắp hết hàng (còn " + batch.getCurrentQuantity() + " đơn vị)");
            }
            
            // Check OUT_OF_STOCK (quantity = 0)
            if (batch.getCurrentQuantity() == 0) {
                createAlertIfNotExists(batch, "LOW_STOCK",
                    "Lô thuốc " + batch.getBatchNumber() + " đã hết hàng");
            }
        }
    }

    /**
     * Create an alert only if it doesn't already exist (unresolved) for the same batch and type.
     * This prevents duplicate alerts.
     */
    private void createAlertIfNotExists(MedicineBatch batch, String type, String message) {
        boolean exists = alertRepository.existsByBatchAndAlertTypeAndIsResolvedFalse(batch, type);
        if (!exists) {
            MedicineStockAlert alert = new MedicineStockAlert();
            alert.setMedicine(batch.getMedicine());
            alert.setBatch(batch);
            alert.setAlertType(type);
            alert.setMessage(message);
            alertRepository.save(alert);
        }
    }

    private void createAlert(MedicineBatch batch, String type, String message) {
        MedicineStockAlert alert = new MedicineStockAlert();
        alert.setMedicine(batch.getMedicine());
        alert.setBatch(batch);
        alert.setAlertType(type);
        alert.setMessage(message);
        alertRepository.save(alert);
    }

    private MedicineBatchResponse mapToBatchResponse(MedicineBatch entity) {
        MedicineBatchResponse dto = new MedicineBatchResponse();
        dto.setBatchId(entity.getBatchId());
        dto.setMedicineId(entity.getMedicine().getMedicineId());
        dto.setMedicineName(entity.getMedicine().getMedicineName());
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getSupplierId());
            dto.setSupplierName(entity.getSupplier().getSupplierName());
        }
        dto.setBatchNumber(entity.getBatchNumber());
        dto.setManufactureDate(entity.getManufactureDate());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setImportPrice(entity.getImportPrice());
        dto.setSellingPrice(entity.getSellingPrice());
        dto.setInitialQuantity(entity.getInitialQuantity());
        dto.setCurrentQuantity(entity.getCurrentQuantity());
        // Compute effective status in real-time — no need to wait for nightly CronJob
        dto.setStatus(computeEffectiveStatus(entity));
        if (entity.getImportedBy() != null) dto.setImportedBy(entity.getImportedBy().getUserId());
        dto.setImportedAt(entity.getImportedAt());
        return dto;
    }

    private String computeEffectiveStatus(MedicineBatch batch) {
        LocalDate today = LocalDate.now();
        if (batch.getCurrentQuantity() == 0) return "OUT_OF_STOCK";
        if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today)) return "EXPIRED";
        if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today.plusDays(30))) return "NEAR_EXPIRY";
        if (batch.getCurrentQuantity() <= 10) return "LOW_STOCK";
        return "AVAILABLE";
    }

    private StockTransactionResponse mapToTransactionResponse(StockTransaction entity) {
        StockTransactionResponse dto = new StockTransactionResponse();
        dto.setStockTransactionId(entity.getStockTransactionId());
        dto.setMedicineId(entity.getMedicine().getMedicineId());
        dto.setMedicineName(entity.getMedicine().getMedicineName());
        if (entity.getBatch() != null) {
            dto.setBatchId(entity.getBatch().getBatchId());
            dto.setBatchNumber(entity.getBatch().getBatchNumber());
        }
        dto.setTransactionType(entity.getTransactionType());
        dto.setQuantity(entity.getQuantity());
        dto.setReferenceType(entity.getReferenceType());
        dto.setReferenceId(entity.getReferenceId());
        dto.setNote(entity.getNote());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy().getUserId());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private MedicineStockAlertResponse mapToAlertResponse(MedicineStockAlert entity) {
        MedicineStockAlertResponse dto = new MedicineStockAlertResponse();
        dto.setAlertId(entity.getAlertId());
        dto.setMedicineId(entity.getMedicine().getMedicineId());
        dto.setMedicineName(entity.getMedicine().getMedicineName());
        if (entity.getBatch() != null) {
            dto.setBatchId(entity.getBatch().getBatchId());
            dto.setBatchNumber(entity.getBatch().getBatchNumber());
        }
        dto.setAlertType(entity.getAlertType());
        dto.setMessage(entity.getMessage());
        dto.setIsResolved(entity.getIsResolved());
        if (entity.getResolvedBy() != null) dto.setResolvedBy(entity.getResolvedBy().getUserId());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    @Override
    public void checkStockAvailability(Long medicineId, Integer requiredQuantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found"));
        
        Integer availableStock = batchRepository.findBatches(medicineId, "AVAILABLE", Pageable.unpaged())
                .stream()
                .mapToInt(MedicineBatch::getCurrentQuantity)
                .sum();
        
        if (availableStock < requiredQuantity) {
            throw new BusinessException(
                    String.format("Không đủ tồn kho cho thuốc [%s]. Yêu cầu: %d, Tồn kho: %d",
                            medicine.getMedicineName(), requiredQuantity, availableStock)
            );
        }
    }
}

