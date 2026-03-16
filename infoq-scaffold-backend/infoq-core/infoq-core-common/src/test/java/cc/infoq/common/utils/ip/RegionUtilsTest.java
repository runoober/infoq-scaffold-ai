package cc.infoq.common.utils.ip;

import cn.hutool.core.io.resource.ResourceUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lionsoul.ip2region.service.Config;
import org.lionsoul.ip2region.service.ConfigBuilder;
import org.lionsoul.ip2region.service.Ip2Region;
import org.mockito.MockedStatic;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class RegionUtilsTest {

    @Test
    @DisplayName("getRegion/close: should cover fallback and close branches with mocked engine")
    void getRegionAndCloseShouldCoverBranches() throws Exception {
        Ip2Region ip2Region = mock(Ip2Region.class);
        byte[] ipOk = new byte[] {1, 2, 3, 4};
        byte[] ipBlank = new byte[] {2, 3, 4, 5};
        byte[] ipError = new byte[] {3, 4, 5, 6};

        when(ip2Region.search("1.1.1.1")).thenReturn("CN");
        when(ip2Region.search("blank")).thenReturn(" ");
        when(ip2Region.search("boom")).thenThrow(new RuntimeException("query failed"));
        when(ip2Region.search(ipOk)).thenReturn("BYTE_CN");
        when(ip2Region.search(ipBlank)).thenReturn("");
        when(ip2Region.search(ipError)).thenThrow(new RuntimeException("query byte failed"));
        doThrow(new RuntimeException("close failed")).when(ip2Region).close(10000L);

        ConfigBuilder v4Builder = mock(ConfigBuilder.class);
        ConfigBuilder v6Builder = mock(ConfigBuilder.class);
        Config v4Config = mock(Config.class);
        Config v6Config = mock(Config.class);
        when(v4Builder.setCachePolicy(anyInt())).thenReturn(v4Builder);
        when(v4Builder.setXdbInputStream(any(InputStream.class))).thenReturn(v4Builder);
        when(v4Builder.setCacheSliceBytes(anyInt())).thenReturn(v4Builder);
        when(v4Builder.asV4()).thenReturn(v4Config);
        when(v6Builder.setCachePolicy(anyInt())).thenReturn(v6Builder);
        when(v6Builder.setXdbInputStream(any(InputStream.class))).thenReturn(v6Builder);
        when(v6Builder.setCacheSliceBytes(anyInt())).thenReturn(v6Builder);
        when(v6Builder.asV6()).thenReturn(v6Config);

        try (MockedStatic<ResourceUtil> resourceUtil = mockStatic(ResourceUtil.class);
             MockedStatic<Config> configStatic = mockStatic(Config.class);
             MockedStatic<Ip2Region> ip2RegionStatic = mockStatic(Ip2Region.class, invocation -> {
                 if ("create".equals(invocation.getMethod().getName())) {
                     return ip2Region;
                 }
                 return invocation.callRealMethod();
             })) {
            resourceUtil.when(() -> ResourceUtil.getStream("ip2region_v4.xdb"))
                .thenReturn(new ByteArrayInputStream(new byte[] {1}));
            resourceUtil.when(() -> ResourceUtil.getStreamSafe("ip2region_v6.xdb"))
                .thenReturn(new ByteArrayInputStream(new byte[] {2}));
            configStatic.when(Config::custom).thenReturn(v4Builder, v6Builder);
            assertSame(ip2Region, Ip2Region.create((Config) null, (Config) null));

            RegionUtils instance = new RegionUtils();
            assertNotNull(instance);

            assertEquals("CN", RegionUtils.getRegion("1.1.1.1"));
            assertEquals(RegionUtils.UNKNOWN_ADDRESS, RegionUtils.getRegion("blank"));
            assertEquals(RegionUtils.UNKNOWN_ADDRESS, RegionUtils.getRegion("boom"));

            assertEquals("BYTE_CN", RegionUtils.getRegion(ipOk));
            assertEquals(RegionUtils.UNKNOWN_ADDRESS, RegionUtils.getRegion(ipBlank));
            assertEquals(RegionUtils.UNKNOWN_ADDRESS, RegionUtils.getRegion(ipError));

            assertDoesNotThrow(() -> RegionUtils.close(Duration.ofMillis(7)));
            assertDoesNotThrow(() -> RegionUtils.close());
            assertDoesNotThrow(() -> RegionUtils.close(null));

            verify(ip2Region).close(7L);
            verify(ip2Region, atLeast(2)).close(10000L);

            Field ip2RegionField = RegionUtils.class.getDeclaredField("ip2Region");
            ip2RegionField.setAccessible(true);
            Object original = ip2RegionField.get(null);
            ip2RegionField.set(null, null);
            try {
                assertDoesNotThrow(() -> RegionUtils.close());
                assertDoesNotThrow(() -> RegionUtils.close(Duration.ofSeconds(1)));
            } finally {
                ip2RegionField.set(null, original);
            }
        }
    }
}
