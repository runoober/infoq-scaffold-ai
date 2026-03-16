package cc.infoq.common.validate.enumd;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Tag("dev")
class EnumPatternValidatorTest {

    @Test
    @DisplayName("initialize/isValid: should match enum getter value")
    void initializeAndIsValidShouldMatchEnumGetterValue() {
        EnumPattern annotation = mock(EnumPattern.class);
        when(annotation.type()).thenReturn((Class) DemoStatus.class);
        when(annotation.fieldName()).thenReturn("code");
        EnumPatternValidator validator = new EnumPatternValidator();

        validator.initialize(annotation);

        assertTrue(validator.isValid("1", null));
    }

    @Test
    @DisplayName("isValid: should return false for blank or unmatched value")
    void isValidShouldReturnFalseForBlankOrUnmatchedValue() {
        EnumPattern annotation = mock(EnumPattern.class);
        when(annotation.type()).thenReturn((Class) DemoStatus.class);
        when(annotation.fieldName()).thenReturn("code");
        EnumPatternValidator validator = new EnumPatternValidator();
        validator.initialize(annotation);

        assertFalse(validator.isValid("", null));
        assertFalse(validator.isValid("9", null));
    }

    private enum DemoStatus {
        ENABLE("1"),
        DISABLE("0");

        private final String code;

        DemoStatus(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}
