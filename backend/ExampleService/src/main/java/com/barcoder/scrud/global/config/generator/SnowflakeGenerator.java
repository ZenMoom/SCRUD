package com.barcoder.scrud.global.config.generator;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;

import java.util.EnumSet;

public class SnowflakeGenerator implements BeforeExecutionGenerator {

    private static final SnowflakeWorker worker = new SnowflakeWorker(1, 1);

    @Override
    public Object generate(SharedSessionContractImplementor session, Object entity, Object currentValue, EventType eventType) {
        return worker.nextId();
    }

    @Override
    public EnumSet<EventType> getEventTypes() {
        return EnumSet.of(EventType.INSERT); // ID는 INSERT 시점에만 생성됨
    }

}
