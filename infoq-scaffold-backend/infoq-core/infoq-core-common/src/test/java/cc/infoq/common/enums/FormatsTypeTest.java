package cc.infoq.common.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Tag("dev")
class FormatsTypeTest {

    @Test
    @DisplayName("getFormatsType: should resolve matching format and throw when not matched")
    void getFormatsTypeShouldResolveMatchingFormatAndThrowWhenNotMatched() {
        assertEquals(FormatsType.YY, FormatsType.getFormatsType("yy-MM-dd"));
        assertThrows(RuntimeException.class, () -> FormatsType.getFormatsType("not-a-format"));
    }
}
