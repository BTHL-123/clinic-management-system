package com.clinicmanagement.prescription;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse.InteractionDetail;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DrugInteractionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;

    private static final Map<String, List<String[]>> MOCK_INTERACTIONS;

    static {
        MOCK_INTERACTIONS = new HashMap<>();

        // 1. Thuốc chống đông máu (Warfarin)
        List<String[]> warfarinList = new ArrayList<>();
        warfarinList.add(new String[]{"aspirin", "HIGH", "Tăng nguy cơ chảy máu (xuất huyết) khi dùng chung Warfarin và Aspirin."});
        warfarinList.add(new String[]{"ibuprofen", "HIGH", "Các thuốc NSAID làm tăng tác dụng chống đông máu của Warfarin, dễ gây xuất huyết."});
        warfarinList.add(new String[]{"amiodarone", "SEVERE", "Amiodarone ức chế chuyển hóa Warfarin, làm tăng mạnh nguy cơ xuất huyết đe dọa tính mạng."});
        warfarinList.add(new String[]{"fluconazole", "HIGH", "Fluconazole làm tăng nồng độ Warfarin trong máu."});
        MOCK_INTERACTIONS.put("warfarin", warfarinList);

        // 2. Thuốc tiểu đường (Metformin)
        List<String[]> metforminList = new ArrayList<>();
        metforminList.add(new String[]{"alcohol", "MEDIUM", "Rượu làm tăng nguy cơ nhiễm toan lactic khi dùng chung với Metformin."});
        metforminList.add(new String[]{"iodinated contrast", "SEVERE", "Chất cản quang chứa iod có thể gây suy thận cấp, dẫn đến tích lũy Metformin và nhiễm toan lactic."});
        MOCK_INTERACTIONS.put("metformin", metforminList);

        // 3. Thuốc mỡ máu (Simvastatin / Atorvastatin)
        List<String[]> simvastatinList = new ArrayList<>();
        simvastatinList.add(new String[]{"clarithromycin", "SEVERE", "Clarithromycin ức chế enzyme CYP3A4, làm tăng nồng độ Simvastatin trong máu và tăng nguy cơ tiêu cơ vân."});
        simvastatinList.add(new String[]{"amlodipine", "LOW", "Amlodipine có thể làm tăng nhẹ nồng độ Simvastatin."});
        simvastatinList.add(new String[]{"grapefruit", "MEDIUM", "Nước ép bưởi ức chế CYP3A4, làm tăng nồng độ Statin trong máu gây độc tính."});
        MOCK_INTERACTIONS.put("simvastatin", simvastatinList);
        MOCK_INTERACTIONS.put("atorvastatin", simvastatinList); // Atorvastatin có chung cơ chế tương tác

        // 4. Kháng sinh (Ciprofloxacin)
        List<String[]> ciproList = new ArrayList<>();
        ciproList.add(new String[]{"antacid", "MEDIUM", "Thuốc kháng acid (Antacid) làm giảm hấp thu Ciprofloxacin; nên uống cách nhau ít nhất 2 giờ."});
        ciproList.add(new String[]{"tizanidine", "SEVERE", "Ciprofloxacin làm tăng nồng độ Tizanidine, gây hạ huyết áp và an thần quá mức."});
        ciproList.add(new String[]{"calcium", "LOW", "Canxi có thể làm giảm nhẹ sự hấp thu của Ciprofloxacin."});
        MOCK_INTERACTIONS.put("ciprofloxacin", ciproList);

        // 5. Thuốc tim mạch / Huyết áp (Sildenafil, Lisinopril, Clopidogrel)
        List<String[]> sildenafilList = new ArrayList<>();
        sildenafilList.add(new String[]{"nitroglycerin", "SEVERE", "Dùng chung gây tụt huyết áp nghiêm trọng có thể đe dọa tính mạng."});
        sildenafilList.add(new String[]{"isosorbide", "SEVERE", "Chống chỉ định tuyệt đối do nguy cơ tụt huyết áp cấp."});
        MOCK_INTERACTIONS.put("sildenafil", sildenafilList);

        List<String[]> lisinoprilList = new ArrayList<>();
        lisinoprilList.add(new String[]{"spironolactone", "HIGH", "Dùng chung làm tăng nguy cơ tăng kali máu nghiêm trọng có thể gây ngừng tim."});
        lisinoprilList.add(new String[]{"ibuprofen", "MEDIUM", "NSAID làm giảm tác dụng hạ huyết áp của Lisinopril và ảnh hưởng chức năng thận."});
        MOCK_INTERACTIONS.put("lisinopril", lisinoprilList);

        List<String[]> clopidogrelList = new ArrayList<>();
        clopidogrelList.add(new String[]{"omeprazole", "HIGH", "Omeprazole làm giảm tác dụng chống kết tập tiểu cầu của Clopidogrel, tăng nguy cơ huyết khối."});
        clopidogrelList.add(new String[]{"esomeprazole", "HIGH", "Tương tự Omeprazole, làm giảm hoạt lực của Clopidogrel."});
        MOCK_INTERACTIONS.put("clopidogrel", clopidogrelList);

        // 6. Thuốc nội tiết (Levothyroxine)
        List<String[]> levoList = new ArrayList<>();
        levoList.add(new String[]{"iron", "MEDIUM", "Sắt làm giảm hấp thu Levothyroxine, cần uống cách nhau ít nhất 4 giờ."});
        levoList.add(new String[]{"calcium", "MEDIUM", "Canxi làm giảm hấp thu Levothyroxine ra máu."});
        MOCK_INTERACTIONS.put("levothyroxine", levoList);

        // 7. Kháng sinh phổ biến (Amoxicillin)
        List<String[]> amoxList = new ArrayList<>();
        amoxList.add(new String[]{"methotrexate", "HIGH", "Amoxicillin làm giảm bài tiết Methotrexate, tăng nguy cơ ngộ độc Methotrexate."});
        amoxList.add(new String[]{"allopurinol", "MEDIUM", "Tăng tỷ lệ mắc bệnh phát ban ngoài da."});
        MOCK_INTERACTIONS.put("amoxicillin", amoxList);

        // 8. Giảm đau hạ sốt (Paracetamol)
        List<String[]> paraList = new ArrayList<>();
        paraList.add(new String[]{"alcohol", "HIGH", "Dùng chung với nhiều rượu làm tăng nguy cơ tổn thương gan nghiêm trọng."});
        paraList.add(new String[]{"warfarin", "LOW", "Paracetamol liều cao kéo dài có thể làm tăng nhẹ tác dụng của Warfarin."});
        MOCK_INTERACTIONS.put("paracetamol", paraList);
    }

    @Transactional
    public DrugInteractionResponse checkInteraction(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Prescription not found: #" + prescriptionId));

        List<InteractionDetail> interactions = new ArrayList<>();

        List<String> ingredients = prescription.getItems().stream()
                .map(item -> {
                    String ing = item.getMedicine().getActiveIngredient();
                    return ing != null
                            ? ing.toLowerCase().trim()
                            : item.getMedicine().getMedicineName().toLowerCase().trim();
                })
                .toList();

        for (int i = 0; i < ingredients.size(); i++) {
            for (int j = i + 1; j < ingredients.size(); j++) {
                checkPair(ingredients.get(i), ingredients.get(j), interactions);
                checkPair(ingredients.get(j), ingredients.get(i), interactions);
            }
        }

        String warningLevel = determineWarningLevel(interactions);
        String warningMessage = buildWarningMessage(interactions, warningLevel);

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

    public DrugInteractionResponse checkInteractionDraft(List<Long> medicineIds) {
        List<Medicine> medicines = medicineRepository.findAllById(medicineIds);
        List<InteractionDetail> interactions = new ArrayList<>();

        List<String> ingredients = medicines.stream()
                .map(m -> {
                    String ing = m.getActiveIngredient();
                    return ing != null
                            ? ing.toLowerCase().trim()
                            : m.getMedicineName().toLowerCase().trim();
                })
                .toList();

        for (int i = 0; i < ingredients.size(); i++) {
            for (int j = i + 1; j < ingredients.size(); j++) {
                checkPair(ingredients.get(i), ingredients.get(j), interactions);
                checkPair(ingredients.get(j), ingredients.get(i), interactions);
            }
        }

        String warningLevel = determineWarningLevel(interactions);
        String warningMessage = buildWarningMessage(interactions, warningLevel);

        return new DrugInteractionResponse(
                null, // No prescriptionId yet
                warningLevel,
                warningMessage,
                interactions,
                true
        );
    }

    private void checkPair(String drug1, String drug2, List<InteractionDetail> result) {
        List<String[]> known = MOCK_INTERACTIONS.get(drug1);
        if (known == null) return;
        for (String[] interaction : known) {
            if (drug2.contains(interaction[0]) || interaction[0].contains(drug2)) {
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
        if ("NONE".equals(level)) return "Không phát hiện tương tác thuốc nguy hiểm nào.";
        StringBuilder sb = new StringBuilder();
        sb.append("Phát hiện ").append(interactions.size()).append(" tương tác thuốc:\n");
        for (InteractionDetail d : interactions) {
            String translatedSeverity = switch (d.severity()) {
                case "LOW" -> "THẤP";
                case "MEDIUM" -> "TRUNG BÌNH";
                case "HIGH" -> "NGHIÊM TRỌNG";
                case "SEVERE" -> "CỰC KỲ NGUY HIỂM";
                default -> d.severity();
            };
            sb.append("- [").append(translatedSeverity).append("] ")
              .append(d.drug1()).append(" + ").append(d.drug2())
              .append(": ").append(d.description()).append("\n");
        }
        return sb.toString().trim();
    }
}
