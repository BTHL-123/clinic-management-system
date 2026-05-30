package com.clinicmanagement.prescription;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse;
import com.clinicmanagement.prescription.dto.DrugInteractionResponse.InteractionDetail;
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

    private static final Map<String, List<String[]>> MOCK_INTERACTIONS;

    static {
        MOCK_INTERACTIONS = new HashMap<>();

        List<String[]> warfarinList = new ArrayList<>();
        warfarinList.add(new String[]{"aspirin", "HIGH", "Increased bleeding risk when Warfarin and Aspirin are used together."});
        warfarinList.add(new String[]{"ibuprofen", "HIGH", "NSAIDs increase the anticoagulant effect of Warfarin."});
        MOCK_INTERACTIONS.put("warfarin", warfarinList);

        List<String[]> metforminList = new ArrayList<>();
        metforminList.add(new String[]{"alcohol", "MEDIUM", "Alcohol increases the risk of lactic acidosis with Metformin."});
        MOCK_INTERACTIONS.put("metformin", metforminList);

        List<String[]> simvastatinList = new ArrayList<>();
        simvastatinList.add(new String[]{"clarithromycin", "SEVERE", "Clarithromycin inhibits CYP3A4, increasing Simvastatin levels and risk of rhabdomyolysis."});
        simvastatinList.add(new String[]{"amlodipine", "LOW", "Amlodipine may slightly increase Simvastatin levels."});
        MOCK_INTERACTIONS.put("simvastatin", simvastatinList);

        List<String[]> ciproList = new ArrayList<>();
        ciproList.add(new String[]{"antacid", "MEDIUM", "Antacids reduce Ciprofloxacin absorption; take 2 hours apart."});
        MOCK_INTERACTIONS.put("ciprofloxacin", ciproList);
    }

    // Task 48: Check drug interactions
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
        if ("NONE".equals(level)) return "No dangerous drug interactions detected.";
        StringBuilder sb = new StringBuilder();
        sb.append("Found ").append(interactions.size()).append(" drug interaction(s):\n");
        for (InteractionDetail d : interactions) {
            sb.append("- [").append(d.severity()).append("] ")
              .append(d.drug1()).append(" + ").append(d.drug2())
              .append(": ").append(d.description()).append("\n");
        }
        return sb.toString().trim();
    }
}
