package cc.infoq.system.service.impl;

import cc.infoq.common.constant.CacheNames;
import cc.infoq.common.constant.SystemConstants;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.redis.utils.CacheUtils;
import cc.infoq.common.utils.MapstructUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.system.domain.bo.SysConfigBo;
import cc.infoq.system.domain.entity.SysConfig;
import cc.infoq.system.domain.vo.SysConfigVo;
import cc.infoq.system.mapper.SysConfigMapper;
import cn.hutool.core.lang.Dict;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.linpeilie.Converter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.support.GenericApplicationContext;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SysConfigServiceImplTest {

    @Mock
    private SysConfigMapper sysConfigMapper;

    private CacheManager cacheManager;
    private Cache cache;
    private SysConfigServiceImpl service;

    @BeforeEach
    void setUp() {
        cacheManager = mock(CacheManager.class);
        cache = mock(Cache.class);
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(Converter.class, () -> mock(Converter.class));
        context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
        context.registerBean(CacheManager.class, () -> cacheManager);
        context.refresh();
        new SpringUtils().setApplicationContext(context);
        lenient().when(cacheManager.getCache(anyString())).thenReturn(cache);
        service = new SysConfigServiceImpl(sysConfigMapper);
    }

    @Test
    @DisplayName("selectRegisterEnabled: should parse true from config value")
    void selectRegisterEnabledShouldParseTrue() {
        SysConfig config = new SysConfig();
        config.setConfigValue("true");
        when(sysConfigMapper.selectOne(any())).thenReturn(config);

        assertTrue(service.selectRegisterEnabled());
    }

    @Test
    @DisplayName("selectPageConfigList: should return paged rows")
    void selectPageConfigListShouldReturnPagedRows() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigName("name");
        bo.setConfigType("Y");
        bo.setConfigKey("key");
        bo.getParams().put("beginTime", "2026-03-01 00:00:00");
        bo.getParams().put("endTime", "2026-03-08 00:00:00");
        Page<SysConfigVo> page = new Page<>(1, 10);
        SysConfigVo vo = new SysConfigVo();
        vo.setConfigId(1L);
        page.setRecords(List.of(vo));
        page.setTotal(1L);
        when(sysConfigMapper.selectVoPage(any(), any())).thenReturn(page);

        var result = service.selectPageConfigList(bo, new cc.infoq.common.mybatis.core.page.PageQuery(10, 1));

        assertEquals(1L, result.getTotal());
        assertEquals(1, result.getRows().size());
    }

    @Test
    @DisplayName("selectConfigList: should delegate with built query wrapper")
    void selectConfigListShouldDelegateWithBuiltQueryWrapper() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigKey("sys.key");
        when(sysConfigMapper.selectVoList(any())).thenReturn(List.of(new SysConfigVo()));

        List<SysConfigVo> result = service.selectConfigList(bo);

        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("selectConfigById: should delegate to mapper")
    void selectConfigByIdShouldDelegateToMapper() {
        SysConfigVo vo = new SysConfigVo();
        vo.setConfigId(11L);
        when(sysConfigMapper.selectVoById(11L)).thenReturn(vo);

        SysConfigVo result = service.selectConfigById(11L);

        assertEquals(11L, result.getConfigId());
    }

    @Test
    @DisplayName("selectConfigByKey: should return empty string when key not found")
    void selectConfigByKeyShouldReturnEmptyWhenNotFound() {
        when(sysConfigMapper.selectOne(any())).thenReturn(null);

        String value = service.selectConfigByKey("missing");

        assertEquals("", value);
    }

    @Test
    @DisplayName("insertConfig: should return config value when insert succeeds")
    void insertConfigShouldReturnConfigValueWhenInsertSucceeds() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigKey("k1");
        bo.setConfigValue("v1");
        SysConfig entity = new SysConfig();
        entity.setConfigKey("k1");
        entity.setConfigValue("v1");
        when(sysConfigMapper.insert(entity)).thenReturn(1);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysConfig.class)).thenReturn(entity);

            String result = service.insertConfig(bo);

            assertEquals("v1", result);
        }
    }

    @Test
    @DisplayName("insertConfig: should throw when insert affects zero rows")
    void insertConfigShouldThrowWhenInsertAffectsZeroRows() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigKey("k0");
        bo.setConfigValue("v0");
        SysConfig entity = new SysConfig();
        entity.setConfigKey("k0");
        entity.setConfigValue("v0");
        when(sysConfigMapper.insert(entity)).thenReturn(0);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysConfig.class)).thenReturn(entity);

            assertThrows(ServiceException.class, () -> service.insertConfig(bo));
        }
    }

    @Test
    @DisplayName("updateConfig: should evict old key and update by id")
    void updateConfigShouldEvictOldKeyAndUpdateById() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigId(1L);
        bo.setConfigKey("new.key");
        bo.setConfigValue("newValue");
        SysConfig entity = new SysConfig();
        entity.setConfigId(1L);
        entity.setConfigKey("new.key");
        entity.setConfigValue("newValue");
        SysConfig old = new SysConfig();
        old.setConfigId(1L);
        old.setConfigKey("old.key");
        when(sysConfigMapper.selectById(1L)).thenReturn(old);
        when(sysConfigMapper.updateById(entity)).thenReturn(1);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class);
             MockedStatic<CacheUtils> cacheUtils = mockStatic(CacheUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysConfig.class)).thenReturn(entity);

            String value = service.updateConfig(bo);

            assertEquals("newValue", value);
            cacheUtils.verify(() -> CacheUtils.evict(CacheNames.SYS_CONFIG, "old.key"));
        }
    }

    @Test
    @DisplayName("updateConfig: should update by key when configId is null")
    void updateConfigShouldUpdateByKeyWhenConfigIdIsNull() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigId(null);
        bo.setConfigKey("sys.mode");
        bo.setConfigValue("dev");
        SysConfig entity = new SysConfig();
        entity.setConfigId(null);
        entity.setConfigKey("sys.mode");
        entity.setConfigValue("dev");
        when(sysConfigMapper.update(eq(entity), any())).thenReturn(1);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class);
             MockedStatic<CacheUtils> cacheUtils = mockStatic(CacheUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysConfig.class)).thenReturn(entity);

            String value = service.updateConfig(bo);

            assertEquals("dev", value);
            cacheUtils.verify(() -> CacheUtils.evict(CacheNames.SYS_CONFIG, "sys.mode"));
        }
    }

    @Test
    @DisplayName("updateConfig: should throw when no rows updated")
    void updateConfigShouldThrowWhenNoRowsUpdated() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigId(null);
        bo.setConfigKey("sys.mode");
        bo.setConfigValue("prod");
        SysConfig entity = new SysConfig();
        entity.setConfigId(null);
        entity.setConfigKey("sys.mode");
        entity.setConfigValue("prod");
        when(sysConfigMapper.update(eq(entity), any())).thenReturn(0);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class);
             MockedStatic<CacheUtils> cacheUtils = mockStatic(CacheUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysConfig.class)).thenReturn(entity);

            assertThrows(ServiceException.class, () -> service.updateConfig(bo));
            cacheUtils.verify(() -> CacheUtils.evict(CacheNames.SYS_CONFIG, "sys.mode"));
        }
    }

    @Test
    @DisplayName("deleteConfigByIds: should reject built-in config")
    void deleteConfigByIdsShouldRejectBuiltInConfig() {
        SysConfig builtIn = new SysConfig();
        builtIn.setConfigId(1L);
        builtIn.setConfigType(SystemConstants.YES);
        builtIn.setConfigKey("sys.builtin");
        when(sysConfigMapper.selectByIds(List.of(1L))).thenReturn(List.of(builtIn));

        assertThrows(ServiceException.class, () -> service.deleteConfigByIds(List.of(1L)));
    }

    @Test
    @DisplayName("deleteConfigByIds: should evict cache and delete rows")
    void deleteConfigByIdsShouldEvictCacheAndDeleteRows() {
        SysConfig normal = new SysConfig();
        normal.setConfigId(2L);
        normal.setConfigType("N");
        normal.setConfigKey("sys.normal");
        when(sysConfigMapper.selectByIds(List.of(2L))).thenReturn(List.of(normal));

        try (MockedStatic<CacheUtils> cacheUtils = mockStatic(CacheUtils.class)) {
            service.deleteConfigByIds(List.of(2L));

            verify(sysConfigMapper).deleteByIds(List.of(2L));
            cacheUtils.verify(() -> CacheUtils.evict(CacheNames.SYS_CONFIG, "sys.normal"));
        }
    }

    @Test
    @DisplayName("checkConfigKeyUnique: should return false when key exists")
    void checkConfigKeyUniqueShouldReturnFalseWhenKeyExists() {
        SysConfigBo bo = new SysConfigBo();
        bo.setConfigKey("dup");
        bo.setConfigId(1L);
        when(sysConfigMapper.exists(any())).thenReturn(true);

        assertFalse(service.checkConfigKeyUnique(bo));
    }

    @Test
    @DisplayName("resetConfigCache: should clear cache namespace")
    void resetConfigCacheShouldClearNamespace() {
        try (MockedStatic<CacheUtils> cacheUtils = mockStatic(CacheUtils.class)) {
            service.resetConfigCache();
            cacheUtils.verify(() -> CacheUtils.clear(CacheNames.SYS_CONFIG));
        }
    }

    @Test
    @DisplayName("getConfigValue: should call selectConfigByKey through AOP proxy")
    void getConfigValueShouldCallSelectConfigByKeyThroughAopProxy() {
        SysConfigServiceImpl spyService = spy(service);
        doReturn("v").when(spyService).selectConfigByKey("k");

        try (MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class)) {
            springUtils.when(() -> SpringUtils.getAopProxy(spyService)).thenReturn(spyService);

            String value = spyService.getConfigValue("k");

            assertEquals("v", value);
        }
    }

    @Test
    @DisplayName("getConfigArray: should parse list json through config value")
    void getConfigArrayShouldParseListJsonThroughConfigValue() {
        SysConfigServiceImpl spyService = spy(service);
        doReturn("[\"a\",\"b\"]").when(spyService).getConfigValue("arr");

        List<String> list = spyService.getConfigArray("arr", String.class);

        assertEquals(List.of("a", "b"), list);
    }

    @Test
    @DisplayName("getConfigMap/getConfigArrayMap: should parse map and map-list json")
    void getConfigMapAndArrayMapShouldParseJson() {
        SysConfigServiceImpl spyService = spy(service);
        doReturn("{\"k\":\"v\"}").when(spyService).getConfigValue("map");
        doReturn("[{\"k\":\"v1\"},{\"k\":\"v2\"}]").when(spyService).getConfigValue("map-list");

        Dict map = spyService.getConfigMap("map");
        List<Dict> mapList = spyService.getConfigArrayMap("map-list");

        assertEquals("v", map.getStr("k"));
        assertEquals(2, mapList.size());
        assertEquals("v2", mapList.get(1).getStr("k"));
    }

    @Test
    @DisplayName("getConfigObject: should parse json into target object")
    void getConfigObjectShouldParseJsonIntoTargetObject() {
        SysConfigServiceImpl spyService = spy(service);
        doReturn("{\"configKey\":\"sys.mode\",\"configValue\":\"dev\"}")
            .when(spyService).getConfigValue("obj");

        SysConfig object = spyService.getConfigObject("obj", SysConfig.class);

        assertEquals("sys.mode", object.getConfigKey());
        assertEquals("dev", object.getConfigValue());
    }
}
