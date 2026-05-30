package com.clinicmanagement.prescription;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse.InteractionDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DrugInteractionService {

    private final PrescriptionRepository prescriptionRepository;

    // Bảng tương tác giả lập (active ingredient → danh sách tương tác)
    private static final Map<String, List<String[]>> MOCK_INTERACTIONS = Map.of(
        "warfarin", List.of(
            new String[]{"aspirin", "HIGH", "Tăng nguy cơ chảy máu nghiêm trọng khi dùng chung Warfarin và Aspirin."},
            new String[]{"ibuprofen", "HIGH", "NSAIDs làm tăng tác dụng chống đông của Warfarin."}
        ),
        "metformin", List.of(
            new String[]{"alcohol", "MEDIUM", "Rượu làm tăng nguy cơ nhiễm toan lactic khi dùng Metformin."}
        ),
        "simvastatin", List.of(
            new String[]{"clarithromycin", "SEVERE", "Clarithromycin ức chế CYP3A4, làm tăng nồng độ Simvastatin gây tiêu cơ vân."},
            new String[]{"amlodipine", "LOW", "Amlodipine có thể làm tăng nhẹ nồng độ Simvastatin."}
        ),
        "ciprofloxacin", List.of(
            new String[]{"antacid", "MEDIUM", "Antacid làm giảm hấp thu Ciprofloxacin, nên uống cách nhau 2 giờ."}
        )
    );

    // ── CHECK DRUG INTERACTION (Task 48 core) ─────────────────────────────────
    @Transactional
    public DrugInteractionResponse checkInteraction(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn thuốc #" + prescriptionId));

        List<InteractionDetail> interactions = new ArrayList<>();

        // Lấy danh sách active ingredient của các thuốc trong đơn
        List<String> ingredients = prescription.getItems().stream()
                .map(item -> {
                    String ing = item.getMedicine().getActiveIngredient();
                    return ing != null ? ing.toLowerCase().trim() : item.getMedicine().getMedicineName().toLowerCase().trim();
                })
                .toList();

        // Kiểm tra tương tác từng cặp
        for (int i = 0; i < ingredients.size(); i++) {
            for (int j = i + 1; j < ingredients.size(); j++) {
                String drug1 = ingredients.get(i);
                String drug2 = ingredients.get(j);

                checkPair(drug1, drug2, interactions);
                checkPair(drug2, drug1, interactions);
            }
        }

        // Xác định mức độ cảnh báo cao nhất
        String warningLevel = determineWarningLevel(interactions);
        String warningMessage = buildWarningMessage(interactions, warningLevel);

        // Cập nhật prescription
        prescription.setDrugInteractionChecked(true);
        prescription.setInteractionWarning(warningMessage);
        prescription.setCheckedAt(LocalDateTime.now());
        prescriptionRepository.save(prescription);

        return new DrugInteractionResponse(
                prescriptionId,
                warningLevel,
                warningMessage,
                interactions,
                true
        );
    }

    private void checkPair(String drug1, String drug2, List<InteractionDetail> result) {
        List<String[]> knownInteractions = MOCK_INTERACTIONS.get(drug1);
        if (knownInteractions == null) return;

        for (String[] interaction : knownInteractions) {
            if (drug2.contains(interaction[0]) || interaction[0].contains(drug2)) {
                // Tránh thêm trùng
                boolean exists = result.stream().anyMatch(d ->
                    (d.drug1().equals(drug1) && d.drug2().equals(drug2)) ||
                    (d.drug1().equals(drug2) && d.drug2().equals(drug1))
                );
                if (!exists) {
                    result.add(new InteractionDetail(drug1, drug2, interaction[1], interaction[2]));
                }
            }
        }
    }

    private String determineWarningLevel(List<InteractionDetail> interactions) {
        if (interactions.isEmpty()) return "NONE";
        List<String> levels = List.of("LOW", "MEDIUM", "HIGH", "SEVERE");
        return interactions.stream()
                .map(InteractionDetail::severity)
                .max((a, b) -> levels.indexOf(a) - levels.indexOf(b))
                .orElse("NONE");
    }

    private String buildWarningMessage(List<InteractionDetail> interactions, String level) {
        if ("NONE".equals(level)) return "Không phát hiện tương tác thuốc nguy hiểm.";
        StringBuilder sb = new StringBuilder();
        sb.append("Phát hiện ").append(interactions.size()).append(" tương tác thuốc:\n");
        for (InteractionDetail d : interactions) {
            sb.append("• [").append(d.severity()).append("] ")
              .append(d.drug1()).append(" + ").append(d.drug2())
              .append(": ").append(d.description()).append("\n");
        }
        return sb.toString().trim();
    }
}
